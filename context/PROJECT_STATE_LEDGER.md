# REGISTRO MAESTRO DEL PROYECTO (PROJECT STATE LEDGER)

Este documento es obligatorio según los protocolos de desarrollo del proyecto. Mantiene la memoria estructurada y garantiza estabilidad absoluta.

## A) ESTADO GLOBAL DEL PROYECTO

- **Nombre**: Xanezu Catch
- **Objetivo**: Juego de arcade premium con arquitectura híbrida Angular + Canvas.
- **Estado Actual**: Estable (ARCH_MIGRATED)
- **Versión**: 1.8.0-TS
- **Riesgo**: Bajo (Migración de motor completada)

## B) ARQUITECTURA DE NAVEGACIÓN

- `main_menu` -> `mode_select` -> `chapter_select` -> `loading_screen` -> `gameplay`
- Estructura de pantallas gestionada por componentes Angular en el DOM.
- Navegación lógica centralizada en `GameStateService.ts`.
- Gameplay renderizado exclusivamente en un elemento Canvas aislado.

## C) MÓDULOS FUNCIONALES

| Módulo | Estado | Archivos Implicados | Dependencias |
| :--- | :--- | :--- | :--- |
| **Núcleo de Juego** | ESTABLE | `game-engine.ts`, `main.ts` | `GameStateService`, `AssetLoader` |
| **Interfaz (DOM)** | ESTABLE | `ui/`, `app.component.ts` | `GameStateService` |
| **Motor de Audio** | ESTABLE | `music-synth.ts`, `audio.service.ts` | Web Audio API |
| **Entidades** | ESTABLE | `engine/entities/` | `GameEngine` |
| **Persistencia** | ESTABLE | `game-data.service.ts` | LocalStorage / Signals |

## D) UI / UX (LOCKED STATE)

- [LOCKED] Sistema de navegación mediante Angular Router / GameStateService.
- [LOCKED] Interfaz de usuario (Menús, Botones) implementada en HTML/CSS.
- [LOCKED] Estructura de `ChapterSelect` (Componente Angular).
- [LOCKED] HUD Dinámico (Componente Angular overlay sobre el Canvas).
- [LOCKED] Sistema de Selección de Skins (Glassmorphism 2.0).

## E) CAMBIOS RECIENTES (CHANGELOG)

- **2026-04-30**: **v1.8.2-STABLE**: **OPTIMIZACIÓN VISUAL STORY**. Corregido el error de carga de fondos en el Nivel 1 de Historia (Pathing fix) y eliminados todos los indicadores de texto sobre el jugador (FloatingText disabled) por requerimiento de diseño.
- **2026-04-30**: **v1.8.1-STABLE**: **ESTABILIZACIÓN DEL MOTOR**. Corregido el bucle de nivel (reset nivel 10 -> 0) y suavizada la cámara en modo ABLIA (eliminado efecto terremoto). Implementado salto con clic izquierdo del ratón.
- **2026-04-30**: **REVERSIÓN ABLIA**: Se ha revertido la nomenclatura 'TALK' a 'ABLIA' en todo el proyecto para mantener consistencia arquitectónica.
- **2026-04-30**: **v1.8.0-TS**: **MIGRACIÓN LEGACY COMPLETADA**. Se ha eliminado definitivamente la carpeta `js/`. Toda la lógica del motor ha sido reescrita en TypeScript y movida a `src/app/game/engine/`. Se ha actualizado el `AssetLoader` para soporte nativo de Angular y se ha integrado el `MusicSynth` como un servicio inyectable.
- **2026-04-29**: Reestructuración de la documentación. Actualizados `README.md`, `GUIA_DE_INSTALACION.md` y reglas del agente para reflejar la arquitectura Angular + TS.
- **2026-04-20**: **v1.8.0-STABLE**: Corrección de errores críticos de ciclo de vida. Resuelto el error NG0100 diferido la inicialización del motor en `GameCanvasComponent`.
- **2026-04-19**: **v1.7.0-ULTRAWIDE**: Reestructuración completa del layout a formato Ultrawide 30:9. HUD movido fuera del Canvas al DOM (Angular).

## F) PROBLEMAS CONOCIDOS

- Ninguno detectado. Sistema migrado y verificado.
