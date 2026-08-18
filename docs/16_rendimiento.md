# Consideraciones de Rendimiento

El rendimiento es crítico en **Xanezu Catch** para mantener los 60 FPS estables en múltiples dispositivos.

## Optimización de Renderizado en Canvas
- **Renderizado Condicional**: El motor de juego solo ejecuta el bucle de renderizado cuando el estado del juego es `PLAYING`, evitando el consumo innecesario de CPU y GPU en menús estáticos.
- **Sistema de Partículas Acotado**: Las explosiones de partículas limitan la cantidad de entidades activas simultáneamente en pantalla para evitar caídas de rendimiento en dispositivos de gama baja.
- **No Manipulación del DOM en Gameplay**: El gameplay no genera ni destruye elementos DOM. Las posiciones se calculan en memoria y se dibujan directamente en el canvas.

## Optimización de Assets
- **Formato WebP**: Los fondos de juego (`fondo_intermedio.webp`) y elementos gráficos se almacenan en formato WebP para minimizar el peso del archivo de distribución y acelerar los tiempos de carga en la web.
- **Audio Sintetizado**: Al no descargar archivos de audio pesados en formato MP3 o WAV, la carga inicial es prácticamente instantánea.\n