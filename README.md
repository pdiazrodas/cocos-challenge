# Cocos Capital — Backend Challenge

Este proyecto tiene como objetivo resolver el desafío técnico propuesto por Cocos Capital utilizando tecnologías modernas y buenas prácticas de desarrollo, priorizando reproducibilidad, robustez y claridad.

## 🚀 Tecnologías utilizadas

- **NestJS**: Framework backend en Node.js con estructura modular, soporte para TypeORM y testeo integrado.
- **Docker / Docker Compose**: Para contenerizar la aplicación, simplificar el entorno de desarrollo y automatizar el arranque de servicios.
- **PostgreSQL**: Motor de base de datos relacional, usado localmente como contenedor.
- **pgAdmin**: Interfaz visual para inspeccionar el estado de la base de datos, útil para debugging y validación manual.

## ⚙️ Decisiones tomadas

- 🔧 **Creación de imagen con Docker (multi-stage)**: Se optimizó el tamaño y se aisló la app del entorno de desarrollo, siguiendo buenas prácticas de contenedores productivos.
- 🔁 **Automatización del arranque con Docker Compose**: Permite levantar app + base de datos + panel visual con una sola instrucción (`docker-compose up`), facilitando pruebas y onboarding.
- 🗄️ **Preconfiguración de pgAdmin**: Se incluyó una instancia lista para uso, con conexión automática al contenedor `postgres`, para monitorear datos y validar queries.
- 🧱 **Inicialización de la base mediante script `.sql`**: Se usó el mecanismo oficial del contenedor de PostgreSQL (`/docker-entrypoint-initdb.d/`) para poblar la base solo en el primer arranque con el script provisto en el challenge.
- 🧘 **Implementación de Graceful Shutdown**: Se incorporó un patrón de apagado ordenado mediante captura de señales del sistema (SIGINT, SIGTERM), evitando nuevas entradas mientras se finalizan las solicitudes http activas. Este enfoque garantiza mayor estabilidad ante interrupciones controladas.
- 📂 **Estructura modular por recursos**: Los módulos `users`, `instruments`, `portfolio` y `orders` fueron generados y estructurados de forma independiente para facilitar escalabilidad y separación de responsabilidades.
- 📝 **Mapeo explícito de entidades con nombres SQL en minúsculas**: Debido a que PostgreSQL convierte los nombres de columnas no entrecomillados a minúsculas por defecto, las entidades TypeORM fueron definidas utilizando `@Column({ name: '...' })` para asegurar compatibilidad total con el esquema generado por el script SQL original. Esto permite mantener nombres camelCase en el código TypeScript sin introducir ambigüedades ni errores al consultar.
- 🧠 Uso del esquema original sin modificaciones estructurales: La implementación se basa íntegramente en las tablas, campos y datos provistos en el archivo database.sql del challenge. No se han introducido índices adicionales ni alteraciones en la estructura de la base. Todas las consultas, joins y filtrados fueron diseñados para operar de forma eficiente sobre el esquema propuesto, maximizando claridad y mantenibilidad sin comprometer compatibilidad con la base original.

## 🔐 Acceso a pgAdmin

| Campo      | Valor                   |
| ---------- | ----------------------- |
| URL        | `http://localhost:5050` |
| Email      | `admin@cocos.com`       |
| Contraseña | `admin`                 |

La conexión a la base está preconfigurada. Si se requiere ingresar manualmente:

| Campo         | Valor        |
| ------------- | ------------ |
| Host          | `postgres`   |
| Puerto        | `5432`       |
| Usuario       | `cocos_user` |
| Contraseña    | `cocos_pass` |
| Base de datos | `cocos`      |

## 📦 Arranque rápido

```bash
docker-compose up --build
```

## 🧮 Construcción del endpoint de Portfolio

Se implementó el servicio `PortfolioService.getPortfolioForUser(userId)` con los siguientes criterios y cálculos:

### 1. Cálculo de pesos disponibles (`availableCash`)

- Fuente: tabla `orders`
- Órdenes relevantes: `CASH_IN`, `SELL`, `CASH_OUT`, `BUY` con estado `FILLED`
- Fórmula: `size × price`, con signo según tipo de orden
- Ejecutado como `rawQuery` por claridad y reproducibilidad (mismo SQL que en pgAdmin)
- No se realiza validación de existencia de usuario dado que eso sería parte de lógica de autenticación, la cual no es necesaria según la consiga.

Ejemplo de SQL utilizado:

```sql
-- Calcula el saldo neto disponible para un usuario
SELECT SUM(
  CASE
    WHEN side = 'CASH_IN'  THEN size * price -- Entrada de dinero
    WHEN side = 'SELL'     THEN size * price -- Venta de instrumento: entra dinero
    WHEN side = 'CASH_OUT' THEN -1 * size * price -- Retiro: sale dinero
    WHEN side = 'BUY'      THEN -1 * size * price -- Compra: sale dinero
    ELSE 0 -- Otras operaciones no afectan el cash disponible
  END
) AS available_cash
FROM orders
WHERE userid = 1 AND status = 'FILLED'; -- Considera solo órdenes ejecutadas

```

### 2. Cálculo de posiciones (`PortfolioPositionDto[]`)

- Fuente: `orders` + `instruments` + `marketdata`
- Agrupamiento por instrumento excluyendo tipo `MONEDA`
- Cálculos:
  - `quantity = BUY - SELL`
  - `marketValue = quantity × closePrice`
  - `dailyReturn = (closePrice - previousClose) / previousClose × 100`
  - `totalMarketValue = SUM(marketValue)` mediante `OVER ()`
- Utiliza CTE (`WITH positions AS (...)`) para encapsular lógica agregada y simplificar cálculos derivados

Ejemplo de SQL utilizado

```sql
-- CTE para calcular posiciones agrupadas por instrumento
WITH positions AS (
  SELECT
    i.id AS instrumentId,
    i.ticker,
    i.name,
    i.type,
    SUM(
      CASE
        WHEN o.side = 'BUY'  THEN o.size       -- Compra suma al total
        WHEN o.side = 'SELL' THEN -1 * o.size  -- Venta resta al total
        ELSE 0
      END
    ) AS quantity, -- Cantidad neta de unidades adquiridas
    md.close AS closePrice,
    md.previousclose AS previousClose
  FROM orders o
  JOIN instruments i ON o.instrumentId = i.id
  JOIN (
    SELECT instrumentid, close, previousclose
    FROM marketdata
    WHERE date = (SELECT MAX(date) FROM marketdata) -- Limita el JOIN a una única cotización por instrumento (última registrada) para preservar agrupamiento correcto
  ) md ON md.instrumentid = i.id
  WHERE o.status = 'FILLED'
    AND o.userId = 1
    AND i.type <> 'MONEDA' -- Excluye instrumentos tipo moneda
  GROUP BY i.id, i.ticker, i.name, i.type, md.close, md.previousclose
  HAVING SUM(
    CASE
      WHEN o.side = 'BUY'  THEN o.size
      WHEN o.side = 'SELL' THEN -1 * o.size
      ELSE 0
    END
  ) > 0 -- Solo se muestran instrumentos con posición positiva
)
-- Consulta final con cálculos derivados
SELECT
  *,
  quantity * closePrice AS marketValue, -- Valor de mercado actual por instrumento
  ROUND(((closePrice - previousClose) / previousClose) * 100, 2) AS dailyReturn, -- Variación diaria (%)
  SUM(quantity * closePrice) OVER () AS totalMarketValue -- Suma total del portafolio
FROM positions;
```

### 3. Valor total de la cuenta

- Cálculo final:
  ```ts
  totalAccountValue = availableCash + totalMarketValue;
  ```

### 4. Criterios técnicos aplicados

- Se utilizó SQL validado previamente en pgAdmin para garantizar trazabilidad
- Se evitó QueryBuilder por su complejidad en agregaciones y joins múltiples
- Ambas consultas (availableCash y positions) se estructuraron como rawQuery
- Las columnas se transformaron mediante @Column({ name: ... }) por compatibilidad con el esquema SQL en minúsculas
- Se mantiene consistencia y estilo uniforme para facilitar testing, mantenimiento y validación

## 🔍 Servicio de búsqueda de instrumentos (/portfolio)

Se implementó el método `InstrumentService.search(searchTerm)` con el objetivo de ofrecer una búsqueda más intuitiva y robusta, desambiguando términos con acentos y filtrando resultados irrelevantes.

### 1. Lógica principal

- Se realiza una consulta raw SQL sobre la tabla instruments
- Se aplican funciones unaccent y ILIKE sobre los campos ticker y name
- Se excluyen explícitamente instrumentos de tipo MONEDA (currency) para evitar ruido en los resultados

### 2. Ejemplo de SQL utilizado

```sql
SELECT id, ticker, name, type
FROM instruments
WHERE type != 'currency' AND (
      unaccent(ticker) ILIKE unaccent('%visiòn%')
   OR unaccent(name) ILIKE unaccent('%visiòn%')
);
```

### 3. Detalles técnicos

- La extensión unaccent se habilita automáticamente al iniciar la base, gracias a su inclusión en el script ubicado en /docker-entrypoint-initdb.d/
- La búsqueda es case-insensitive y tolerante a acentos, mejorando la experiencia del usuario final
- El resultado se devuelve como un array de objetos Instrument, listo para consumir desde el frontend

## 🔍 Servicio de creación de órdenes (/orders)

### 1. ✨ Descripción general

- Se implementó un endpoint POST /orders que permite registrar órdenes de tipo BUY o SELL en modalidad MARKET o LIMIT.
- El usuario puede enviar la cantidad exacta de acciones (size) o un monto total de inversión (investmentAmount). No se admiten fracciones.
- Toda orden es persistida, incluso si es rechazada por reglas de negocio.

### 2. 🧠 Lógica aplicada

- Validación del instrumento (existe y no es tipo MONEDA)
- Obtención de último precio si la orden es MARKET
- Cálculo de sizeToUse (cantidad) si se envía un monto
- Validación financiera:
  - BUY: usuario debe tener suficiente availableCash (dinero disponible)
  - SELL: usuario debe tener suficiente availableShares (acciones disponibles)
- Determinación del estado:
  - FILLED si se ejecuta
  - NEW si queda pendiente (LIMIT)
  - REJECTED si no cumple requisitos

Ejemplo de SQL utilizado:

```sql
-- Obtiene el último precio de cierre para un instrumento
SELECT close
FROM marketdata
WHERE instrumentid = $1
  AND date = (
    SELECT MAX(date)
    FROM marketdata
    WHERE instrumentid = $1
  );
```

Uso:

- Se aplica en órdenes MARKET para determinar el precio de ejecución
- Compartido por BuyOrderStrategy y SellOrderStrategy

```sql
-- Calcula la cantidad de acciones disponibles para vender
SELECT SUM(
  CASE
    WHEN side = 'BUY' THEN size       -- Compra suma a tenencia
    WHEN side = 'SELL' THEN -1 * size -- Venta resta
    ELSE 0
  END
) AS available_shares
FROM orders
WHERE userid = $1 AND instrumentid = $2 AND status = 'FILLED';
```

Uso:

- Se utiliza para validar si el usuario tiene suficientes acciones para ejecutar una orden de venta
- Contempla solo órdenes ejecutadas (FILLED) para reflejar tenencia real

### 3. 📦 Estructura esperada de la orden enviada

```json
{
  "userId": 1,
  "instrumentId": 2,
  "side": "BUY",
  "type": "MARKET",
  "size": 10
}
```

🔄 O bien:

```json
{
  "userId": 1,
  "instrumentId": 2,
  "side": "SELL",
  "type": "LIMIT",
  "investmentAmount": 5000,
  "price": 265
}
```

### 4. 🧱 Detalles técnicos

- Se aplican validaciones condicionales en el DTO para asegurar que se envíe size o investmentAmount, pero no ambos.
- Los strategies BuyOrderStrategy y SellOrderStrategy encapsulan toda la lógica con métodos auxiliares reutilizables.
- Se utiliza rawQuery para los cálculos financieros (availableCash, availableShares).
- Las órdenes se graban en la tabla orders con estado según resultado de validación.

### 5. Tests y validaciones funcionales

#### 🔬 Testing manual

Se probó la aplicación enviando órdenes de compra y venta por cantidad y por monto

Se validó que:

- Las órdenes se registren correctamente en PostgreSQL
- El endpoint portfolio refleje los cambios financieros con precisión
- El endpoint /orders retorne estados esperados (FILLED, NEW, REJECTED)

#### 🧪 Casos cubiertos

| Tipo de orden | Modalidad | Condición             | Resultado esperado |
| ------------- | --------- | --------------------- | ------------------ |
| BUY           | MARKET    | Fondos suficientes    | FILLED             |
| BUY           | MARKET    | Fondos insuficientes  | REJECTED           |
| BUY           | LIMIT     | Fondos suficientes    | NEW                |
| BUY           | LIMIT     | Fondos insuficientes  | REJECTED           |
| SELL          | MARKET    | Tenencia suficiente   | FILLED             |
| SELL          | MARKET    | Tenencia insuficiente | REJECTED           |
| SELL          | LIMIT     | Tenencia suficiente   | NEW                |
| SELL          | LIMIT     | Tenencia insuficiente | REJECTED           |

#### ⚖️ Consideración sobre órdenes LIMIT

Las órdenes de tipo LIMIT no se ejecutan inmediatamente ni bloquean las posiciones del usuario. Por lo tanto:

- Es posible registrar múltiples órdenes LIMIT sobre una misma tenencia
- Este comportamiento refleja distintas intenciones de venta con precio definido
- La ejecución o cancelación de estas órdenes excede el alcance del challenge
