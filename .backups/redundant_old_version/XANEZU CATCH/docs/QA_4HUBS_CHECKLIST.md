# QA Checklist - 4 Hubs + Audio UX

## Objetivo
Validar que la pantalla de carga y Game Over muestran correctamente los 4 hubs de premios, y que el estado de audio del menu es claro y estable.

## Resoluciones a validar
- Desktop: 1920x1080
- Laptop: 1366x768
- Tablet: 1024x768
- Mobile: 390x844 (o similar)

## Loading Screen
- [ ] Se muestran 4 hubs de tabla de premios en la parte superior de carga.
- [ ] La barra de progreso llega a 100% antes de entrar al gameplay.
- [ ] No hay congelamiento al pasar de loading a juego.

## Game Over
- [ ] Se muestran 4 hubs (2x2): Recompensas, Power-Ups, Gemas, Artefactos.
- [ ] El texto e iconos no se cortan ni se solapan.
- [ ] El boton "SELECCIONAR CAPITULO" abre correctamente CHAPTER_SELECT.

## Audio UX
- [ ] El banner de audio aparece en menu (Bloqueado/On/Off).
- [ ] Al primer click/touch, aparece mini-tooltip de "Audio desbloqueado".
- [ ] El banner hace animacion suave al desbloquear.
- [ ] Cambiar Music/Sound en Settings actualiza el estado del banner.

## Chapter 2 (robustez)
- [ ] Al entrar a CH2, la musica del menu se corta y empieza la musica del capitulo.
- [ ] El obstaculo movil no aparece como rectangulo rojo.
- [ ] Si faltan assets, se usan fallbacks y el gameplay continua.

## Criterio de aceptacion
Todos los checks anteriores en verde en al menos 3 de las 4 resoluciones.
