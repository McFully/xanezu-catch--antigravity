# Restructuración de Arquitectura de Modos de Juego

Este plan implementa la separación estricta, independiente y permanente de los tres modos de juego requeridos (HISTORIA, ARCADE, HABLA), asegurando que haya 48 capítulos en total tratados como entidades únicas y que el sistema del modo Arcade implemente el estado de desbloqueo inicial.

## User Review Required

> [!WARNING]
> **Cambio de Ids y Nomenclatura**: Los identificadores de capítulos pasarán de `number` a `string` (`STORY_CHAPTER_xx`), lo cual obligará a eliminar o actualizar cualquier lógica vieja en `localStorage` o lógica dependiente de IDs numéricos para guardar progresos de niveles. Asegúrate de que esto está alineado con tus intenciones.

> [!WARNING]
> **Cambio de ABLIA a HABLA**: Se cambiarán las referencias en UI y código de `ABLIA` a `HABLA` / `TALK` para mantener la consistencia con las reglas solicitadas ("MODO HABLA").

## Proposed Changes

### Core Models y Constants

Modificación de las estructuras base para soportar la independencia de datos:

#### [MODIFY] `chapter.model.ts`

- Actualizar `id` a `string`.
- Especificar completamente `mode: 'STORY' | 'ARCADE' | 'TALK'`.
- Añadir todas las propiedades para escalabilidad: `music`, `objects`, `obstacles`, `objectives`, `winConditions`, `rules`, `stages`.

#### [MODIFY] `game-state.enum.ts`

- Renombrar cualquier cosa relaccionada con ABLIA a `TALK_CHAPTER_SELECT`.

#### [MODIFY] `chapters.constants.ts`

- Dividir `CHAPTERS` en tres constantes separadas: `STORY_CHAPTERS`, `ARCADE_CHAPTERS`, `TALK_CHAPTERS`.
- Generar 16 configuraciones únicas para **Historia** con IDs desde `STORY_CHAPTER_01` a `STORY_CHAPTER_16`.
- Generar 16 configuraciones únicas para **Arcade** con IDs desde `ARCADE_CHAPTER_01` a `ARCADE_CHAPTER_16`. Los niveles del 01 al 12 estarán `unlocked: true`, del 13 al 16 estarán `unlocked: false`.
- Generar 16 configuraciones únicas para **Habla** con IDs desde `TALK_CHAPTER_01` a `TALK_CHAPTER_16`.

> [!IMPORTANT]
> **Asset Pools**: I will implement a system to automatically detect and use the available SVGs in each chapter folder, rather than assuming they all have 'tronco' or 'liana'.
> **Coordinate Scaling**: I will unify the game to a logical resolution (e.g., 1920x1080) and scale the renderer to fit the window, ensuring the 95% ground level is ALWAYS consistent.

### Robust Asset Loading (BiomeRenderer)

- **[MODIFY] [biome-renderer.ts](file:///c:/Users/Aritz/Desktop/Proyectos%20Antigravity/XANEZU%20CATCH%20%20ANTIGRAVITY/src/app/game/renderer/biome-renderer.ts)**:
  - Change `loadChapterAssets` to handle missing files without console errors.
  - Implement a mapping of available obstacles for each biome.

### UI Stability (ChapterSelect)

- **[MODIFY] [chapter-select.ts](file:///c:/Users/Aritz/Desktop/Proyectos%20Antigravity/XANEZU%20CATCH%20%20ANTIGRAVITY/src/app/ui/chapter-select/chapter-select.ts)**:
  - Fix the background image URL construction to strictly avoid `null`.

### Gameplay Refinement (GameEngine & Coordinates)

- **[MODIFY] [engine.constants.ts](file:///c:/Users/Aritz/Desktop/Proyectos%20Antigravity/XANEZU%20CATCH%20%20ANTIGRAVITY/src/app/game/engine/engine.constants.ts)**:
  - Define a logical `BASE_HEIGHT` and `BASE_WIDTH`.
- **[MODIFY] [game-engine.ts](file:///c:/Users/Aritz/Desktop/Proyectos%20Antigravity/XANEZU%20CATCH%20%20ANTIGRAVITY/src/app/game/engine/game-engine.ts)**:
  - Update spawning logic to use grounded coordinates.
  - Lower the spawn height of collectibles.

### Core Services

Modificar la lógica de carga y selección para ajustarse a los nuevos Ids.

#### [MODIFY] `chapter.service.ts`

- Proveer métodos separados como `getChaptersByMode(mode: 'STORY'|'ARCADE'|'TALK')`.
- Actualizar comprobaciones de estado interno con `string` en vez de `number`.
- Modificar funcionalidad `unlockNextChapter` para analizar IDs de cadena.

#### [MODIFY] `game-state.service.ts`

- Ajustar `setChapter` para tomar `chapterId: string`.
- Buscar en la constante correcta agrupando los 48 capítulos.

### Interfaz UI

Adaptar el selector de capítulos para que funcione con la nueva configuración sin fallos.

#### [MODIFY] `chapter-select.ts`

- Cambiar la tarjeta visual "ABLIA" para que muestre "MODO HABLA", apuntando a `TALK`.
- Eliminar los recortes manuales de 12 niveles para el sistema Arcade (`slice(0, 12)`). Ahora el arcade mostrará 16, pero 4 de ellos estarán en estado bloqueado.
- Pasar a depender de la lectura estructurada de `chapter.id` (como string) en `startChapter(ch.id, ch.unlocked)`.

## Open Questions

- ¿Los modos de Arcade y Habla pueden compartir las mismas miniaturas visuales (`folder`) genéricas por ahora o prefieres que cree nuevas rutas ficticias de carpetas (ej. `arcade/1-ciudad-veloz`) que el motor de renderizado gestionará más adelante? De momento propondré reutilizar o apuntar a carpetas estructuradas lógicamente aunque luego no existan los assets hasta la siguiente iteración.

## Verification Plan

### Manual Verification

- Iniciar el servidor local (`npm run dev`).
- Ingresar al menú de Juego y ver la nueva opción de "MODO HABLA" sustituyendo a "ABLIA".
- Seleccionar Modo Historia, Modo Arcade y Modo Habla.
- En Arcade, pasar a la segunda página y comprobar que las últimas 4 están bloqueadas.
- Presionar una de las misiones desbloqueadas para verificar que se carga el nivel correctamente.
