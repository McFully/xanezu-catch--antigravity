# Variables de Entorno

*No Aplica.*

El juego está diseñado para ejecutarse localmente sin depender de variables de entorno complejas (`.env`). Los parámetros ajustables como la velocidad del juego, gravedad base, valores de XP y configuración de niveles se definen directamente en constantes tipadas de TypeScript dentro de:
- `src/app/core/constants/chapters.constants.ts`
- `src/app/game/engine/engine.constants.ts`

Esto asegura que el juego sea portable y no requiera inyección de dependencias ambientales durante el despliegue web o la instalación de escritorio.\n