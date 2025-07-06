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
- 🧘 **Implementación de Graceful Shutdown**: Se incorporó un patrón de apagado ordenado mediante captura de señales del sistema (SIGINT, SIGTERM), evitando nuevas entradas mientras se finalizan las requests activas. Este enfoque lo he aplicado previamente tanto en proyectos personales con Go como en entornos productivos usando NestJS (por ejemplo, durante mi tiempo en Modo), y garantiza mayor estabilidad ante interrupciones controladas.
- 📂 **Estructura modular por recursos**: Los módulos `users`, `instruments`, `portfolio` y `orders` fueron generados y estructurados de forma independiente para facilitar escalabilidad y separación de responsabilidades.
- 📝 **Mapeo explícito de entidades con nombres SQL en minúsculas**: Debido a que PostgreSQL convierte los nombres de columnas no entrecomillados a minúsculas por defecto, las entidades TypeORM fueron definidas utilizando `@Column({ name: '...' })` para asegurar compatibilidad total con el esquema generado por el script SQL original. Esto permite mantener nombres camelCase en el código TypeScript sin introducir ambigüedades ni errores al consultar.

## 🧮 Construcción del endpoint de Portfolio

Se implementó el servicio `PortfolioService.getPortfolioForUser(userId)` con los siguientes criterios y cálculos:

### 1. Cálculo de pesos disponibles (`availableCash`)

- Fuente: tabla `orders`
- Órdenes relevantes: `CASH_IN`, `SELL`, `CASH_OUT`, `BUY` con estado `FILLED`
- Fórmula: `size × price`, con signo según tipo de orden
- Ejecutado como `rawQuery` por claridad y reproducibilidad (mismo SQL que en pgAdmin)

### 2. Cálculo de posiciones (`PortfolioPositionDto[]`)

- Fuente: `orders` + `instruments` + `marketdata`
- Agrupamiento por instrumento excluyendo tipo `MONEDA`
- Cálculos:
  - `quantity = BUY - SELL`
  - `marketValue = quantity × closePrice`
  - `dailyReturn = (closePrice - previousClose) / previousClose × 100`
  - `totalMarketValue = SUM(marketValue)` mediante `OVER ()`
- Utiliza CTE (`WITH positions AS (...)`) para encapsular lógica agregada y simplificar cálculos derivados

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
