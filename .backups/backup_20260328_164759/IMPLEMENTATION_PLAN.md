PRIORIDAD ABSOLUTA - ORDEN EJECUTIVA

Este plan de implementación sustituye cualquier otro plan, checklist, task, workflow o prioridad existente en el proyecto.

INSTRUCCIONES CRÍTICAS:

1. DETENER Y ELIMINAR PRIORIDADES ANTERIORES

* Cancelar cualquier:

  * Plan de implementación activo
  * Task en progreso
  * Checklist
  * Workflow encadenado

* Eliminar o ignorar cualquier lógica previa que:

  * Defina navegación de menús distinta
  * Use HTML como UI
  * Cree flujos alternativos

Este sistema pasa a ser la ÚNICA fuente de verdad.

---

1. DETECCIÓN Y ELIMINACIÓN DE CONFLICTOS

---

Analizar todo el proyecto y:

IDENTIFICAR archivos que:

* Manejen UI HTML
* Definan navegación alternativa
* Usen IDs genéricos (screen-1, etc.)
* Dupliquen lógica de menús

ACCIONES:

* Eliminar archivos innecesarios
* O desactivarlos completamente
* O aislarlos si afectan a otros sistemas

OBJETIVO:
Que NO exista ningún sistema paralelo de UI o navegación.

---

1. BLOQUEO DE ARQUITECTURA

---

A partir de este momento:

* SOLO se permite:

  * UI renderizada por el motor del juego
  * Navegación por estados internos

* PROHIBIDO:

  * HTML interactivo
  * Duplicación de pantallas
  * Navegación híbrida

---

1. PLAN DE IMPLEMENTACIÓN (EJECUTAR EN ORDEN)

---

FASE 1 - LIMPIEZA

* Eliminar UI HTML
* Eliminar listeners DOM
* Reducir HTML a contenedor de canvas

FASE 2 - ESTADOS
Crear estados únicos:

main_menu
mode_select
settings_menu
chapter_select_story
chapter_select_arcade
chapter_select_ablia
loading_screen
gameplay
trophies_screen
shop_screen
load_game_flow

FASE 3 - MAIN_MENU
Mostrar SOLO:

* Nueva Partida → mode_select
* Cargar Partida → load_game_flow
* Mute / Unmute → toggle_audio
* Settings → settings_menu

FASE 4 - SETTINGS_MENU

* Exportar partida
* Importar partida
* Opciones sonido
* Volver → main_menu

FASE 5 - MODE_SELECT

* Historia → chapter_select_story
* Desafío → chapter_select_arcade
* ABL e IA → chapter_select_ablia
* Trofeos → trophies_screen
* Tienda → shop_screen
* Volver → main_menu

Eliminar:

* Modo infinito

FASE 6 - SELECTORES

* chapter_select_story
* chapter_select_arcade
* chapter_select_ablia

Cada uno:
→ loading_screen
→ gameplay

FASE 7 - FLUJO GLOBAL
main_menu
→ mode_select
→ chapter_select
→ loading_screen
→ gameplay

---

1. ELIMINACIÓN DE SISTEMAS REDUNDANTES

---

Eliminar cualquier:

* MenuManager duplicado
* ScreenManager alternativo
* HTML UI controller
* Sistema de navegación paralelo

Debe quedar UN solo gestor de estado.

---

1. DOCUMENTACIÓN OBLIGATORIA

---

Generar: navigation_tree.md

Debe incluir:

* Árbol completo con IDs reales
* Lista de estados
* Mapa de transiciones

Formato:

MAIN_MENU (id: main_menu)
├── Nueva Partida → MODE_SELECT (id: mode_select)
│   ├── Historia → CHAPTER_SELECT_STORY (id: chapter_select_story)
│   │   └── LOADING → GAMEPLAY
│   ├── Desafío → CHAPTER_SELECT_ARCADE (id: chapter_select_arcade)
│   ├── ABL e IA → CHAPTER_SELECT_ABLIA (id: chapter_select_ablia)
│   ├── Trofeos → TROPHIES_SCREEN (id: trophies_screen)
│   └── Tienda → SHOP_SCREEN (id: shop_screen)
│
├── Cargar Partida → LOAD_GAME_FLOW (id: load_game_flow)
├── Settings → SETTINGS_MENU (id: settings_menu)
└── Mute / Unmute (id: toggle_audio)

---

1. VALIDACIÓN FINAL (OBLIGATORIA)

---

Antes de terminar:

* Confirmar que NO existe UI HTML activa
* Confirmar que NO hay sistemas duplicados
* Confirmar que TODOS los botones funcionan
* Confirmar que el flujo es EXACTAMENTE el definido

Si algo entra en conflicto con este sistema:
→ eliminarlo

---

## RESULTADO FINAL

* Un único sistema de menús
* Sin duplicidades
* Controlado por estados
* Totalmente documentado
* Sin interferencias de sistemas antiguos

ESTA IMPLEMENTACIÓN TIENE PRIORIDAD ABSUTA SOBRE TODO LO DEMÁS.
