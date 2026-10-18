# PROJECT_INDEX.md — Cajones Arquitectónicos de Xanezu Catch

Índice quirúrgico de módulos bajo el **Principio Sagrado del Cajón Directo** y **Clean Architecture (< 300 líneas por archivo)**.

## 1. Raíz y Configuración (`Nivel 3`)
- [package.json](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/package.json) — Scripts de compilación, versión oficial (`1.8.0`), autoría Aritz Bahamonde Larxé (`UNLICENSED`).
- [electron_main.js](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/electron_main.js) — Orquestador de ventana nativa Electron (puerto dev `3000` sincronizado).
- [INICIO_WEB.bat](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/INICIO_WEB.bat) — Punto único de ejecución inmediata en puerto `3000`.
- [LICENSE.txt](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/LICENSE.txt) — Licencia privativa oficial Aritz Bahamonde Larxé.

## 2. Core Services, Modelos y Constantes (`src/app/core/`)
- [game-state.service.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/core/services/game-state.service.ts) — Fuente única de verdad para navegación reactiva (Signals) y estado de aplicación.
- [progression.service.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/core/services/progression.service.ts) — Persistencia centralizada (`localStorage`), monedas, récords, dificultad, trofeos y exportación de backup.
- [chapter.service.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/core/services/chapter.service.ts) — Gestión y persistencia de los 48 capítulos independientes (`STORY`, `ARCADE`, `ABLIA`).
- [game-data.service.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/core/services/game-data.service.ts) — Catálogo inmutable de premios, power-ups, gemas, artefactos, tienda y skins.
- [audio.service.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/core/audio.service.ts) — Motor de audio unificado (`AudioContext` único + `MusicSynth`).
- [progression.constants.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/core/constants/progression.constants.ts) — Tabla determinista de niveles 1 a 30 (`sistema-progresion-xp.md`).
- [chapters.constants.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/core/constants/chapters.constants.ts) — Definición de los 48 capítulos únicos (`modos_de_juego.md`).

## 3. Puente Canvas y Motor de Juego (`src/app/canvas/` y `src/app/game/engine/`)
- [game-canvas.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/canvas/game-canvas.ts) — Contenedor `<canvas>` 30:9 y puente de eventos con `HUDComponent`.
- [game-engine.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/engine/game-engine.ts) — Orquestador de bucle de juego (`update` / `render` / ciclo de vida).
- [engine.interfaces.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/engine/engine.interfaces.ts) — Contratos desacoplados del motor (`IGameEngineContext`, `IEngineAudio`).
- [input-controller.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/engine/input-controller.ts) — Gestión de eventos de teclado y puntero con limpieza garantizada.
- [item-effect.system.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/engine/item-effect.system.ts) — Reglas de colisión, combos (`bananas`, `chuches`, `vida extra`), multiplicadores y daño.
- [director-system.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/engine/director-system.ts) — Generador procedimental de oleadas, obstáculos y coleccionables.
- [physics-system.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/engine/physics-system.ts) — Atracción magnética y cinemática de entidades.
- [collision-system.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/engine/collision-system.ts) — Detección AABB con tolerancia de hitbox.
- [asset-loader.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/engine/asset-loader.ts) — Cargador asíncrono de imágenes con caché y telemetría real.
- [music-synth.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/engine/music-synth.ts) — Sintetizador procedimental WebAudio.

## 4. Renderizadores Canvas (`src/app/game/renderer/`)
- [scene-renderer.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/renderer/scene-renderer.ts) — Pipeline de renderizado 2D y cumplimiento de `fondos.md`.
- [biome-renderer.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/renderer/biome-renderer.ts) — Renderizado de fondos (`fondo_intermedio.webp` estricto en Story) y sprites.
- [ablia-renderer.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/renderer/ablia-renderer.ts) — Orquestador de renderizado procedimental para las 16 civilizaciones ABLIA.
- [ablia-themes.constants.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/renderer/ablia-themes.constants.ts) — Paletas cromáticas de las 16 civilizaciones ABLIA.
- [ablia-primitives.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/renderer/ablia-primitives.ts) — Primitivas geométricas Canvas 2D para monumentos y parallax ABLIA.
- [loading-renderer.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/renderer/loading-renderer.ts) — Renderizador de transición en Canvas.

## 5. Entidades (`src/app/game/entities/`)
- [player.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/entities/player.ts) — Entidad jugador, físicas de salto, combos y skins.
- [item.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/entities/item.ts) — Entidad coleccionable (frutas, chuches, gemas, powerups).
- [obstacle.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/game/entities/obstacle.ts) — Entidad obstáculo con soporte de explosión (`bananas combo`).

## 6. Capa UI Angular DOM (`src/app/ui/`)
- [hud.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/ui/hud/hud.ts) / [hud.html](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/ui/hud/hud.html) / [hud.css](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/ui/hud/hud.css) — HUD superior (7 bloques `dom_superior.md`) e inferior.
- [main-menu.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/ui/main-menu/main-menu.ts) — Menú principal, control de audio y EULA.
- [chapter-select.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/ui/chapter-select/chapter-select.ts) / [chapter-select.css](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/ui/chapter-select/chapter-select.css) — Selector de modo y capítulos con paginación.
- [loading-screen.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/ui/loading-screen/loading-screen.ts) / [loading-screen.css](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/ui/loading-screen/loading-screen.css) — Pantalla de carga con 3 hubs de premios y estadísticas reales.
- [game-over.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/ui/game-over/game-over.ts) — Resumen de derrota con 4 hubs 2x2 y retorno al modo activo.
- [victory.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/ui/victory/victory.ts) — Resumen de victoria con desbloqueo y avance al siguiente capítulo.
- [shop.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/ui/shop/shop.ts) — Tienda de mejoras conectada a `ProgressionService`.
- [skin-selector.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/ui/skin-selector/skin-selector.ts) — Selector de skins y avatar conectado a `ProgressionService`.
- [settings.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/ui/settings/settings.ts) — Ajustes de audio, dificultad real y exportación de backup JSON.
- [trophies.ts](file:///e:/Proyectos%20Antigravity/Juegos/Juegos%20para%20Windows/Juego%20Xanezu%20Catch/src/app/ui/trophies/trophies.ts) — Galería de trofeos y métricas persistentes.
