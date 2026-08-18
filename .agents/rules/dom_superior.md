---
trigger: always_on
---

Actúa como arquitecto frontend senior especializado en juegos HTML5 con Canvas y sistema híbrido DOM/Canvas.

OBJETIVO:
Reestructurar completamente el contenedor DOM superior del gameplay según las siguientes especificaciones. Debes eliminar elementos obsoletos, renombrar correctamente todas las tarjetas y definir su nueva lógica visual y funcional.

----------------------------------------
1. ESTRUCTURA GENERAL DEL DOM SUPERIOR
----------------------------------------
- El contenedor DOM superior debe tener EXACTAMENTE la misma altura que el contenedor DOM inferior.
- Debe optimizar el espacio para maximizar el área visible del canvas de gameplay.
- Mantener estructura modular basada en tarjetas (cards).

----------------------------------------
2. ELIMINACIONES Y RENOMBRES
----------------------------------------
- Eliminar completamente la tarjeta: "score"
- Renombrar:
  - "level" → "nivel"
  - "progress" → "progreso"
  - "banana combo" → "bananas combo"
  - "bomb combo" → "chuches combo"
  - "extra life grid" → "vida extra"
  - "lives" → "vidas"
  - "multiplier" → "multiplicador"

----------------------------------------
3. TARJETA: NIVEL + PROGRESO
----------------------------------------
- La primera tarjeta será "nivel"
- Estado inicial: nivel 0
- El nivel 1 se alcanza al llegar a 600 puntos

TARJETA "progreso":
- Barra de progreso 3 veces más larga que una barra estándar
- Debe llenarse dinámicamente según los puntos acumulados
- Mostrar SIEMPRE:
  - Puntos actuales (ej: 450)
  - Puntos necesarios (ej: 600)
  - Diferencia restante (ej: faltan 150)

- Comportamiento:
  - Al completar la barra → subir de nivel
  - Reiniciar barra para el siguiente nivel
  - Escalar progresión para niveles posteriores

----------------------------------------
4. TARJETA: BANANAS COMBO
----------------------------------------
- Se activa al recoger 5 bananas

EFECTO:
- Todos los obstáculos en pantalla:
  - Explotan visualmente
  - Animación de explosión ≈ 1.5 segundos
  - Luego desaparecen completamente

REGLAS:
- Durante la activación y animación:
  - El jugador NO recibe daño
- Reset automático tras ejecución

----------------------------------------
5. TARJETA: CHUCHES COMBO
----------------------------------------
- Grid de 5x2 (10 slots)
- Cada slot representa una chuche presente en pantalla

COMPORTAMIENTO:
- Se asignan dinámicamente 10 chuches visibles del gameplay
- Cada slot se llena con una chuche única (por color/tipo)
- Solo cuentan esas 10 chuches específicas
- Se debe visualizar claramente el llenado progresivo

----------------------------------------
6. TARJETA: VIDA EXTRA
----------------------------------------
- Grid de 5x2 (10 slots)
- Representado con corazones

DISEÑO:
- Corazones al 25% del tamaño de la tarjeta principal de vidas

ESTADO INICIAL:
- 1 corazón lleno
- 2 corazones vacíos visibles (indicando capacidad)

MECÁNICA:
- Recoger corazones en gameplay llena el grid
- Al completar los 10:
  - Reset del grid
  - +1 a "vidas"

----------------------------------------
7. TARJETA: VIDAS
----------------------------------------
- Muestra vidas actuales del jugador
- Se incrementa mediante sistema de "vida extra"
- Si llega a 0 → muerte

----------------------------------------
8. TARJETA: MULTIPLICADOR
----------------------------------------
- Muestra multiplicador activo

REGLAS:
- Multiplicador base: x2 durante 30 segundos
- Si se recoge otro antes de que expire:
  - Se acumula (x2 → x4 → x8 → ...)
  - Se reinicia duración a 30 segundos
- Siempre mostrar valor actual visible (ej: x4)

----------------------------------------
9. REQUISITOS VISUALES Y DE UX
----------------------------------------
- Todas las tarjetas deben ser claras, legibles y modulares
- Feedback visual inmediato en:
  - progreso
  - combos
  - multiplicador
- Animaciones suaves y consistentes con gameplay

----------------------------------------
10. RESTRICCIONES
----------------------------------------
- No introducir lógica de gameplay en el DOM
- El DOM solo refleja estado
- Toda lógica debe provenir del motor de juego (Canvas)

----------------------------------------
RESULTADO ESPERADO:
Un sistema de HUD superior completamente rediseñado, coherente, escalable y alineado con mecánicas de juego arcade moderno, optimizado para integración limpia con motor Canvas.