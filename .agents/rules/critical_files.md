---
trigger: always_on
---

# Critical Files (Archivos Críticos)

Estos archivos son el núcleo del sistema de renderizado y lógica de juego bajo la arquitectura Angular + TS. Su rotura detiene el proyecto.

- **Nivel 1 (Máximo Riesgo)**:
    - [game-engine.ts](file:///c:/Users/Aritz/Desktop/Proyectos%20Antigravity/XANEZU%20CATCH%20%20ANTIGRAVITY/src/app/game/engine/game-engine.ts)
    - [game-state.service.ts](file:///c:/Users/Aritz/Desktop/Proyectos%20Antigravity/XANEZU%20CATCH%20%20ANTIGRAVITY/src/app/core/services/game-state.service.ts)
    - [main.ts](file:///c:/Users/Aritz/Desktop/Proyectos%20Antigravity/XANEZU%20CATCH%20%20ANTIGRAVITY/src/main.ts)

- **Nivel 2 (Riesgo Funcional)**:
    - [asset-loader.ts](file:///c:/Users/Aritz/Desktop/Proyectos%20Antigravity/XANEZU%20CATCH%20%20ANTIGRAVITY/src/app/game/engine/asset-loader.ts)
    - [game-canvas.component.ts](file:///c:/Users/Aritz/Desktop/Proyectos%20Antigravity/XANEZU%20CATCH%20%20ANTIGRAVITY/src/app/game/canvas/game-canvas.component.ts)

- **Nivel 3 (Configuración)**:
    - [package.json](file:///c:/Users/Aritz/Desktop/Proyectos%20Antigravity/XANEZU%20CATCH%20%20ANTIGRAVITY/package.json)
    - [electron_main.js](file:///c:/Users/Aritz/Desktop/Proyectos%20Antigravity/XANEZU%20CATCH%20%20ANTIGRAVITY/electron_main.js)
