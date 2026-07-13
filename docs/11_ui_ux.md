# Diseño de Interfaz y Experiencia de Usuario (UI/UX)

**Xanezu Catch** prioriza una estética visual vibrante y moderna que responde instantáneamente a las acciones del jugador.

## Elementos y Estilo Visual
- **Temática Retro-Futurista y Glassmorphism**: Uso de fondos oscuros, gradientes de neón, desenfoque de fondo (`backdrop-filter`) y bordes semitransparentes brillantes para lograr un diseño limpio y moderno.
- **HUD Superior e Inferior Simétrico**: El contenedor superior que aloja el nivel, combo de bananas, combo de chuches y el multiplicador posee una altura simétrica con respecto al panel inferior del juego, optimizando la visibilidad del Canvas central.
- **Pantalla de Carga Interactiva**: Proporciona una barra de progreso que indica el porcentaje exacto de carga de assets, mostrando logs dinámicos de los archivos que están siendo procesados antes de iniciar el nivel.

## Sonido y Feedback UX
- **Audio Desbloqueado Estilo Moderno**: En cumplimiento con las directivas de los navegadores, el audio se inicializa bloqueado. Al primer clic del usuario, se muestra una animación suave con un mini-tooltip indicando "Audio Desbloqueado".
- **Botón de Audio Rápido**: Disponible en el menú principal y opciones para activar/desactivar la música y los efectos sonoros con un solo clic.\n