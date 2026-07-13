---
trigger: always_on
---

# ÁRBOL DE NAVEGACIÓN Y MAPA DE ESTADOS

Este documento define la estructura oficial de navegación y los estados internos del motor de juego bajo la arquitectura híbrida:

- **UI**: Implementada en Angular (DOM).
- **Gameplay**: Renderizado exclusivamente en Canvas.
- **Navegación**: Centralizada en el servicio `GameStateService`.

---


Este documento define la estructura oficial de navegación y los estados internos del motor de juego bajo una arquitectura con separación de responsabilidades:

- UI implementada en Angular (DOM)
- Gameplay renderizado exclusivamente en Canvas
- Navegación lógica centralizada e independiente del renderizado

---

## 🌳 ÁRBOL DE NAVEGACIÓN

```mermaid
graph TD
    main_menu[MAIN_MENU] --> mode_select[MODE_SELECT]
    main_menu --> load_game_flow[LOAD_GAME_FLOW]
    main_menu --> settings_menu[SETTINGS_MENU]
    main_menu --> toggle_audio[TOGGLE_AUDIO]

    mode_select --> chapter_select_story[CHAPTER_SELECT_STORY]
    mode_select --> chapter_select_arcade[CHAPTER_SELECT_ARCADE]
    mode_select --> chapter_select_ablia[CHAPTER_SELECT_ABLIA]
    mode_select --> skin_selector[SKIN_SELECTOR]
    mode_select --> shop_screen[SHOP_SCREEN]
    mode_select --> trophies_screen[TROPHIES_SCREEN]
    mode_select --> back_main[Volver al Main Menu]

    chapter_select_story --> loading_screen[LOADING_SCREEN]
    chapter_select_arcade --> loading_screen
    chapter_select_ablia --> loading_screen

    loading_screen --> gameplay[GAMEPLAY]

    gameplay --> gameover[GAMEOVER]
    gameplay --> victory[VICTORY]

    gameover --> back_menu[Volver al Menú]
    victory --> back_menu