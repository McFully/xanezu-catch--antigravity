---
trigger: always_on
---

Define una regla de renderizado estricta y obligatoria para el modo PLAYING MODE (Story):

El motor encargado de los fondos durante la ejecución del juego en PLAYING MODE debe utilizar EXCLUSIVAMENTE las imágenes asignadas con el nombre:
fondo_intermedio.webp

Normas inquebrantables:

1. En PLAYING MODE (Story), el fondo visible en todo momento debe ser única y exclusivamente el archivo fondo_intermedio.webp correspondiente al nivel cargado.
2. Esta regla aplica SOLO al entorno de ejecución (playing mode), no a menús, editores ni vistas de capítulos (story/capitulos).
3. Queda terminantemente prohibido en PLAYING MODE:
   - Generar fondos procedurales
   - Superponer capas de fondo adicionales
   - Aplicar shaders, efectos o sistemas que modifiquen o sustituyan el fondo base
4. No se permite ningún sistema alternativo de fondo (dinámico, parallax generado, skybox, etc.) que interfiera con fondo_intermedio.webp.
5. fondo_intermedio.webp debe renderizarse como capa de fondo principal, fija e inalterable.
6. La jerarquía de renderizado debe ser:
   - Fondo base: fondo_intermedio.webp (intocable)
   - Elementos del juego (personajes, físicas, props, UI) por encima
7. Si existe cualquier sistema previo de fondos, debe ser automáticamente desactivado o eliminado en PLAYING MODE.
8. Antes de validar cualquier implementación, se debe verificar que en ejecución real:
   - El fondo visible es exactamente fondo_intermedio.webp
   - No hay capas adicionales ni efectos activos sobre el fondo
   - El comportamiento es consistente en todos los niveles

Objetivo:
Garantizar que en PLAYING MODE (Story) el fondo sea siempre fondo_intermedio.webp, sin variaciones, sin sistemas alternativos y sin interferencias visuales.