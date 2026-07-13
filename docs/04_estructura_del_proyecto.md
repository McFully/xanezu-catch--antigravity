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
│   │   ├── canvas/             # Componente envoltorio de HTML5 Canvas
│   │   ├── core/               # Lógica global, servicios, modelos y constantes
│   │   │   ├── services/       # Servicios de datos, progresión y estado
│   │   │   └── audio.service.ts# Gestor de efectos sonoros y música
│   │   ├── game/               # Motor de juego, físicas, colisiones y niveles
│   │   │   ├── engine/         # Lógica central del motor (GameEngine, AssetLoader, etc.)
│   │   │   └── entities/       # Definición de entidades (jugador, obstáculos, premios)
│   │   └── ui/                 # Componentes UI de Angular (menús, HUD, pantallas)
│   ├── index.html              # Plantilla HTML principal
│   ├── main.ts                 # Punto de entrada de Angular
│   └── styles.css              # Estilos globales de la aplicación
└── tests/                      # Scripts y suites de pruebas unitarias
```\n