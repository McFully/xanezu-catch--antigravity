# Tareas: Refactorización y Mejora UX Antigravity

## Módulos de Juego
- `[x]` Crear o iniciar documento de seguimiento de tareas (task.md)
- `[x]` Actualizar `chapter.model.ts` con nuevos campos y cambiar `id` a string.
- `[x]` Separar los capítulos en `chapters.constants.ts` configurando los 48 IDs únicos (Story, Arcade, Talk) e integrando progreso arcade.
- `[x]` Refactorizar `chapter.service.ts` actualizando los IDs de numbers a strings y dotándolo de `getChaptersByMode`.
- `[x]` Refactorizar `game-state.service.ts` para que reciba `id: string` en el selector de capítulos.
- `[x]` Actualizar interfaz en `chapter-select.ts` para modificar "ABLIA" por "MODO HABLA" (TALK).
- `[x]` Actualizar `chapter-select.ts` para que pase identificadores string y visualice también los capítulos cerrados en ARCADE.
- `[x]` Refactorizar los checks internos en `game-engine.ts` de "ablia" a "talk".
- `[x]` Renombrar carpeta `assets/ABL_IA` a `assets/ablia`
- `[x]` Corregir lógica de carga en `GameEngine.ts` para omitir assets estáticos en modo ABLIA.
- `[x]` Actualizar `AudioService.ts` para prevenir errores 404 en música de capítulos ABLIA.
- `[x]` Corregir error de compilación (Missing `coins` property) en `skin-selector.ts`.
- `[x]` Normalizar sincronización de `mode` en `GameEngine.ts` para evitar peticiones `null`.

## Mejora de Resolución y UX (Aprobado)
- `[x]` Calibrar Sistema de Coordenadas Lógicas (1920x1080)
- `[x]` Unificar todas las dimensiones en `LOGICAL_WIDTH` y `LOGICAL_HEIGHT`
- `[x]` Corregir regresiones de sintaxis y constantes obsoletas
- `[x]` Implementar los 4 Hubs de Recompensas en Game Over (Recompensas, Power-Ups, Gemas, Artefactos)
- `[x]` Validar Audio UX (Botón On/Off con animación y tooltip)
- `[ ]` Verificar funcionamiento con subagente de navegador.

## Otros
- `[x]` Limpiar 404 residuales detectados en consola.
- `[x]` Planificación inicial