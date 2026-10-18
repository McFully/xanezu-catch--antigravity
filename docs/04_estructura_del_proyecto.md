# Estructura del Proyecto

A continuación se detalla la organización de directorios y archivos principales del proyecto:

```
XANEZU CATCH ANTIGRAVITY/
├── .agents/                    # Reglas e instrucciones personalizadas para agentes
├── assets/                     # Recursos estáticos (imágenes, sonidos, iconos, fuentes)
├── build/                      # Recursos de compilación (licencias, imágenes del instalador)
├── docs/                       # Documentación técnica del proyecto (esta carpeta)
├── electron_main.js            # Punto de entrada de la aplicación de escritorio Electron
├── package.json                # Configuración de dependencias y scripts de npm
├── preload.js                  # Script de precarga para puente seguro IPC en Electron
├── scripts/                    # Scripts de utilidades para compilación y generación de assets
├── src/                        # Código fuente de la aplicación Angular
│   ├── app/
│   │   ├── app.ts              # Componente raíz del juego
│   │   ├── app.config.ts       # Configuración global de Angular
│   │   ├── app.routes.ts       # Rutas de la aplicación
│   │   ├── canvas/             # Componente envoltorio de HTML5 Canvas y puente con el DOM
│   │   ├── core/               # Lógica global, servicios, modelos y constantes
│   │   │   ├── constants/      # Progresión determinista XP y 48 capítulos
│   │   │   ├── models/         # Interfaces de estado, capítulos y entidades
│   │   │   ├── services/       # GameStateService, ProgressionService, ChapterService, GameDataService
│   │   │   └── audio.service.ts# Gestor unificado de efectos sonoros y música
│   │   ├── game/               # Motor de juego, físicas, colisiones y renderizadores
│   │   │   ├── engine/         # GameEngine, AssetLoader, InputController, Director, Physics, ItemEffects
│   │   │   ├── entities/       # Definición de entidades (Player, Obstacle, Item)
│   │   │   └── renderer/       # SceneRenderer, BiomeRenderer, AbliaRenderer, AbliaPrimitives, LoadingRenderer
│   │   └── ui/                 # Componentes UI de Angular (HUD, menús, pantallas con HTML/CSS desacoplados)
│   ├── index.html              # Plantilla HTML principal
│   ├── main.ts                 # Punto de entrada de Angular
│   └── styles.css              # Estilos globales de la aplicación
└── tests/                      # Suites de pruebas unitarias y de arquitectura (logic.test.mjs)
```\n