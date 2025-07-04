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
