# 🐸 XANEZU CATCH — Sesión de Desarrollo 03/03/2026

## 📋 Estado de la Conversación

**Fecha:** 03 de marzo de 2026, ~01:00 CET  
**Proyecto:** `XANEZU CATCH ANTIGRAVITY 01-03-026`  
**Ruta:** `c:\Users\Aritz\Desktop\Proyectos Antigravity\XANEZU CATCH  ANTIGRAVITY 01-03-026`

---

## ✅ BUGS REPORTADOS (RESUELTOS)

### Bug 1: El ratón no funciona correctamente ✅ RESUELTO

- **Descripción:** El clic del ratón durante el gameplay actúa como si fuera la barra espaciadora (salta), pero luego el juego vuelve al logo/menú.
- **Causa raíz encontrada:** La clase `.menu-buttons` en `style.css` (línea ~2354) tenía `position: fixed !important`, `z-index: 99999 !important`, `pointer-events: auto !important`, y `visibility: visible !important`. Esto hacía que los botones del menú (CAMPAÑA, INFINITO, ARCADE, ABL) estuvieran **siempre encima de todo y siempre clicables**, incluso durante el gameplay. Al hacer clic en cualquier parte, se activaban estos botones invisibles.
- **Solución aplicada:**
  1. Se quitaron los `!important` y se movieron `position: fixed`, `z-index`, `pointer-events: auto`, `visibility: visible` al selector `.overlay.active .menu-buttons` para que solo apliquen cuando el overlay del menú está activo.
  2. Se amplió el filtro de UI en `Game.js` `window.onmousedown` para ignorar clics en `.overlay`, `.back-button`, `.menu-buttons`, `#overlay-container`, etc.

### Bug 2: El personaje y la parte baja de la pantalla no se ven ✅ RESUELTO

- **Descripción:** La parte inferior del canvas está cortada/oculta, haciendo invisible al personaje (rana) y el suelo.
- **Causa raíz:** El `transform: translateY(76px)` estaba en la regla global `canvas {}` (línea 1076), desplazando SIEMPRE el canvas 76px hacia abajo.
- **Solución aplicada:** Se movió el `translateY(76px)` del selector `canvas {}` al selector `body.in-menu canvas {}`, para que solo aplique en el menú y no corte la vista durante el gameplay.

---

## 🏗️ ARQUITECTURA DEL PROYECTO

### Estructura de archivos principal

```
XANEZU CATCH ANTIGRAVITY 01-03-026/
├── index.html          (594 líneas - Layout HTML completo)
├── style.css           (4594 líneas - Design System Premium)
├── js/
│   ├── constants.js    (CANVAS_WIDTH=1280, CANVAS_HEIGHT=720)
│   ├── main.js         (352 líneas - Entry point, navegación global)
│   ├── core/
│   │   ├── Game.js         (1845 líneas - Motor principal del juego)
│   │   ├── UIManager.js    (UI overlays, HUD)
│   │   ├── BiomeRenderer.js (Fondos parallax)
│   │   ├── AssetLoader.js  (Carga de assets)
│   │   ├── MusicSynth.js   (Audio/Música)
│   │   ├── ChapterRegistry.js (Registro de capítulos campaña)
│   │   ├── ArcadeChapterRegistry.js
│   │   ├── ABLChapterRegistry.js
│   │   └── ...
│   ├── entities/
│   │   ├── Player.js       (30274 bytes - Lógica del jugador/rana)
│   │   ├── Companion.js    (Elefante compañero)
│   │   ├── Obstacle.js     (Obstáculos)
│   │   ├── Items.js        (Candy, BonusItem, PowerUp, LevelArtifact)
│   │   ├── Effects.js      (FloatingText, ParticlePool)
│   │   └── Fly.js          (Moscas/coleccionables)
│   └── managers/
│       ├── SpawnManager.js
│       ├── SaveSystem.js
│       ├── ScoreSystem.js
│       ├── ChapterManager.js
│       ├── LevelManager.js
│       ├── GameStateManager.js
│       └── ...
├── assets/             (5511 archivos - Sprites, fondos, audio)
└── docs/
```

### Flujo de Input del juego

1. `window.onmousedown` → Si `state === 'PLAYING'` y botón izquierdo → `frog.jump()`
2. `canvas.onmousedown` → Si `state === 'PLAYING'` y botón derecho → `handleDash()`
3. `window.onkeydown` → Space/ArrowUp/W → `frog.jump()`, Shift/D/ArrowRight → `handleDash()`
4. `touchstart` → Mitad izquierda → jump, Mitad derecha → dash

### Estados del juego

- `LOADING` → `MENU` → `CHAPTER_SELECT` → `PLAYING` → `GAMEOVER`/`VICTORY`
- Modos: Campaña, Arcade, ABL (Adaptive), Infinito

### CSS del canvas durante gameplay vs menú

- `body.in-menu canvas` → `opacity: 0 !important` (oculta canvas en menú)
- `body.in-menu #game-container` → Muestra fondo del menú como imagen
- Canvas general tiene `transform: translateY(76px)` que causa el bug de recorte

---

## 📝 PLAN DE CORRECCIÓN (NO EJECUTADO AÚN)

### Paso 1: Arreglar el canvas cortado

- Archivo: `style.css`
- Cambio: Mover el `translateY(76px)` para que solo aplique en menú:

```css
/* ANTES (bug) */
canvas {
  transform: translateY(76px);
}

/* DESPUÉS (fix) */
canvas {
  /* Sin transform global */
}
body.in-menu canvas {
  opacity: 0 !important;
  transform: translateY(76px); /* Solo en menú si es necesario */
}
```

### Paso 2: Investigar por qué el clic devuelve al menú

- Revisar si algún overlay invisible tiene `pointer-events: auto`
- Verificar que `returnToMenu()` no se llama accidentalmente
- Revisar el `overlay-container` y sus hijos
- Posible que un clic golpee un botón hidden del overlay

### Paso 3: Verificar en navegador

- Abrir el juego con Live Server
- Probar gameplay con las correcciones
- Confirmar que el personaje y suelo son visibles
- Confirmar que el clic funciona sin devolver al menú

---

## 🔗 CONVERSACIONES PREVIAS RELEVANTES

| ID | Título | Resumen |
|----|--------|---------|
| `6efaaebb-...` | Loading Screen Styling | Diseño premium de pantalla de carga |
| `394afa5b-...` | HUD Text & Collision QA | Triple stroke en score, QA de colisiones |
| `3b4ff365-...` | Asset Loading Errors | Fix de CANVAS_HEIGHT y errores de carga |
| `d4c3e815-...` | Game Assets Generation | Scripts de generación de assets |

---

## ⚙️ CONFIGURACIÓN DEL AGENTE

- **Idioma:** Siempre responder en español
- **Entregables por solicitud:** Plan de implementación + Lista de tasks + Walkthrough
- **Skills globales:** `~/.gemini/antigravity/skills/`

---

## 🔄 PARA CONTINUAR

Copia y pega esto al empezar una nueva sesión:

> **Contexto:** Estoy trabajando en el juego XANEZU CATCH (ruta: `c:\Users\Aritz\Desktop\Proyectos Antigravity\XANEZU CATCH  ANTIGRAVITY 01-03-026`). Lee el archivo `docs/SESION_ACTUAL_03-03-2026.md` para conocer el estado actual. Hay 2 bugs pendientes: (1) el ratón vuelve al menú al hacer clic durante gameplay, y (2) el personaje/parte baja del canvas está cortada por un `translateY(76px)` en el CSS del canvas. Necesito que los arregles.
