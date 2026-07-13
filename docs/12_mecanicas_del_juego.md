# Mecánicas del Juego

La jugabilidad de **Xanezu Catch** está diseñada bajo un enfoque arcade dinámico y ágil, centrado en físicas fluidas en 2D.

## Físicas y Movimiento
- **Control del Jugador**: El personaje se desplaza horizontalmente con fuerzas de inercia y fricción en el eje X, logrando deslizamientos suaves.
- **Salto y Gravedad**: Sistema de saltos con gravedad constante. El personaje puede saltar para alcanzar premios elevados o esquivar obstáculos.
- **Colisiones**: Caja de colisión rectangular (AABB) simplificada para garantizar que la detección a 60 FPS sea eficiente e instantánea.

## Mecánicas de Combo
- **Bananas Combo**: Al recolectar 5 bananas, se produce una detonación visual en el lienzo y todos los obstáculos en pantalla explotan durante 1.5 segundos antes de ser eliminados. El jugador es invulnerable durante este proceso.
- **Chuches Combo**: Una grilla de 5x2 slots almacena visualmente las chuches recolectadas, ofreciendo recompensas o bonificaciones de puntuación al completarse.
- **Vida Extra**: Al recolectar corazones en juego se va completando una grilla de 10 slots en miniatura. Al llenarse, otorga un corazón adicional a la barra de vidas principal.
- **Multiplicador de Puntos**: Recoger multiplicadores incrementa temporalmente el multiplicador (`x2`, `x4`, `x8`, etc.) por 30 segundos, reiniciando la cuenta atrás si se consigue otro multiplicador antes de que el tiempo expire.\n