# Lógica Principal del Sistema

La ejecución de **Xanezu Catch** está controlada por la orquestación entre la UI en Angular y el Motor en Canvas a través del `GameStateService`.

## Flujo de Arranque y Ciclo de Vida del Juego

1. **BOOT**: La aplicación arranca, se inicializan configuraciones globales y se verifica la disponibilidad del entorno (web o desktop).
2. **MAIN_MENU**: Muestra la pantalla de inicio principal, permitiendo navegar a ajustes, tienda, selector de skins, trofeos o jugar.
3. **MODE_SELECT**: El usuario selecciona uno de los tres modos de juego: Historia, Arcade o Ablia.
4. **CHAPTER_SELECT**: El usuario selecciona el capítulo/nivel a jugar de una grilla de 16 niveles por modo (48 en total).
5. **LOADING_SCREEN**: Se instancia el componente de juego, se monta el lienzo Canvas y `AssetLoader` carga en memoria de manera asíncrona todas las imágenes necesarias para el nivel específico.
6. **PLAYING**: Se activa el loop de juego mediante `requestAnimationFrame`. El `GameEngine` actualiza los estados físicos y redibuja las entidades del canvas en cada frame.
7. **PAUSED**: El loop de juego se detiene visualmente y se muestra una capa DOM con opciones de reanudar, reiniciar o salir.
8. **GAME_OVER / VICTORY**: Al cumplir la condición de derrota (vidas = 0) o victoria, se cancela el loop de juego, se reportan las estadísticas y recompensas al `GameDataService`, y se vuelve al DOM para mostrar el resumen.\n