---
trigger: always_on
---

# Estándar de Arquitectura Angular + Canvas

Este documento define la arquitectura oficial del proyecto Xanezu Catch. La separación de responsabilidades entre la interfaz de usuario y el motor de juego es estricta y obligatoria.

## PRINCIPIO FUNDAMENTAL

- **Canvas**: Utilizado EXCLUSIVAMENTE para el renderizado del gameplay (personajes, obstáculos, fondo de nivel, efectos de partículas).
- **Angular DOM**: Utilizado para TODA la interfaz de usuario, menús, navegación y HUD.

Bajo ninguna circunstancia se deben dibujar elementos de UI (botones, textos de menú, navegación) dentro del Canvas.

────────────────────────────

### CAPA 1 - INTERFAZ (UI LAYER)

La interfaz se implementa mediante componentes Angular estándar (`HTML` + `CSS`).

**Componentes Principales:**
- `ui/main-menu`: Menú principal de inicio.
- `ui/chapter-select`: Navegador de capítulos (Story, Arcade, Ablia).
- `ui/settings`: Configuración de audio y controles.
- `ui/game-over`: Resumen de resultados y hubs de premios.

**Responsabilidades:**
- Gestión de eventos de usuario (clicks, navegación).
- Visualización de estados globales (XP, Gemas, Skins).
- Estos componentes son independientes del ciclo de vida del Canvas.

────────────────────────────

### CAPA 2 - GESTOR DE ESTADO (CORE)

Servicio central: `src/app/core/services/game-state.service.ts`

Este servicio es la **única fuente de verdad** para la navegación y el estado de la aplicación.

**Estados Principales (GameState):**
- `BOOT`, `MAIN_MENU`, `CHAPTER_SELECT`, `PLAYING`, `PAUSED`, `SETTINGS`, `GAME_OVER`.

El estado es reactivo (Signals / Observables), lo que permite que Angular actualice la UI automáticamente al cambiar de escena.

────────────────────────────

### CAPA 3 - MOTOR DE JUEGO (CANVAS)

Componente Canvas: `src/app/game/canvas/game-canvas.component.ts`

**Responsabilidades:**
- Encapsular el elemento `<canvas>`.
- Orquestar el ciclo de vida del `GameEngine`.
- Iniciar el loop de renderizado en `ngAfterViewInit` y detenerlo en `ngOnDestroy`.

El Canvas solo se monta y existe en el DOM cuando el estado es `PLAYING`.

────────────────────────────

### CAPA 4 - NÚCLEO TÉCNICO (ENGINE)

Ubicación: `src/app/game/engine/`

Motor independiente escrito en TypeScript puro.

**Responsabilidades del GameEngine:**
- `update()`: Lógica de física, colisiones y estado del juego.
- `render()`: Dibujo en el contexto 2D del Canvas.
- `AssetLoader`: Carga asíncrona de recursos antes del inicio del gameplay.

────────────────────────────

## REGLAS DE ORO

1. **Sin dependencias circulares**: El motor de juego no debe conocer la existencia de Angular.
2. **UI desacoplada**: El HUD se posiciona mediante CSS `position: absolute` sobre el componente Canvas.
3. **Navegación centralizada**: Solo se navega llamando a `gameStateService.navigate()`.
4. **Limpieza de memoria**: El motor debe liberar todos los recursos y detener el `requestAnimationFrame` al salir del gameplay.

────────────────────────────

Este estándar garantiza un sistema estable, mantenible y con un rendimiento visual premium.