# Gestión de Estado

La gestión de estado del juego está centralizada para garantizar que la interfaz Angular y el bucle del Canvas actúen de manera coordinada.

## Herramientas Utilizadas
- **Angular Signals**: Proporcionan reactividad fina y actualizaciones ultra rápidas del DOM para elementos de la interfaz como el HUD, barra de vida y combos.
- **RxJS BehaviorSubjects**: Utilizados para gestionar el flujo de navegación principal debido a su facilidad para manejar eventos asíncronos y mantener el último estado de forma persistente.

## Sincronización entre Angular y Canvas
Cuando el estado cambia a `PLAYING`, se monta el componente `GameCanvasComponent`. Al montarse, obtiene el contexto 2D del Canvas e instancia el `GameEngine`. Al destruirse el componente Angular (por ejemplo, al volver al menú principal), se detiene el `requestAnimationFrame`, se limpian los eventos del teclado y se liberan las referencias de memoria para evitar fugas de recursos.\n