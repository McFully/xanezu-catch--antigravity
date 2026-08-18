import fs from 'fs';
import path from 'path';

const docsDir = 'docs';
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const files = {
  '00_resumen_general.md': `# Resumen General

**Xanezu Catch** es una experiencia arcade premium de alto rendimiento que combina tecnologías modernas de desarrollo web con un motor de renderizado personalizado en 2D basado en HTML5 Canvas.

## Propósito
El objetivo del proyecto es ofrecer un juego ágil, visualmente atractivo (estilo neón y retro-arcade futurista) con mecánicas clásicas de recolección y esquiva, pero potenciado por un motor de física propio, generación de audio por síntesis en tiempo real y una arquitectura moderna e híbrida que separa la interfaz (DOM) de la lógica y renderizado del juego (Canvas).

## Problema que Resuelve
1. **Rendimiento e Interactividad en Web/Desktop**: Separar completamente la interfaz basada en menús complejos del renderizado de alta tasa de refresco (60 FPS) del gameplay, evitando la sobrecarga del DOM tradicional para renderizar cientos de entidades.
2. **Experiencia Desktop y Web Unificada**: Integración con Electron para distribución de instaladores nativos de Windows, manteniendo la capacidad de ejecutarse en navegadores web sin cambios de código.
3. **Persistencia y Progresión Profunda**: Proporciona un sistema de progresión robusto que desbloquea capítulos, skins y recompensas mediante XP y gemas, motivando al usuario a continuar jugando.
`,

  '01_arquitectura.md': `# Arquitectura del Sistema

La arquitectura de **Xanezu Catch** es una estructura híbrida dividida en capas bien delimitadas para garantizar la mantenibilidad y escalabilidad del código.

## Capas del Sistema

\`\`\`mermaid
graph TD
    UI[Capa de Interfaz - Angular DOM] <--> Core[Capa de Estado - GameStateService]
    Core <--> Engine[Capa de Motor - Canvas GameEngine]
    Engine <--> Systems[Sistemas - Physics, Collision, Particles]
\`\`\`

1. **Capa de Interfaz (UI Layer)**:
   - Implementada en **Angular 21** mediante HTML y Vanilla CSS.
   - Maneja menús, selección de capítulos, pantallas de fin de juego (Game Over / Victoria) y el HUD superior del gameplay.

2. **Capa del Gestor de Estado (Core)**:
   - Centralizada en \`GameStateService\`.
   - Utiliza reactividad moderna con Angular Signals y BehaviorSubjects de RxJS.
   - Actúa como la única fuente de verdad para la navegación y estado global del juego (XP, gemas, progreso de carga).

3. **Capa del Motor del Juego (Canvas & Engine)**:
   - Escrita en TypeScript puro.
   - Encapsulada dentro del componente Angular \`GameCanvasComponent\`.
   - Controla el bucle de renderizado (\`requestAnimationFrame\`), inicialización del canvas y carga de assets a través de \`AssetLoader\`.

4. **Sistemas Especializados**:
   - Lógica de físicas, detección de colisiones, simulación de partículas y sintetizador de audio en tiempo real (\`MusicSynth\`).
`,

  '02_stack_tecnologico.md': `# Stack Tecnológico

El proyecto está construido utilizando herramientas y frameworks modernos que garantizan el rendimiento y la portabilidad:

1. **Angular 21**:
   - **Razón**: Permite construir interfaces web modulares, reactivas y fuertemente tipadas mediante componentes y Signals. Simplifica la gestión de rutas y estados complejos.
2. **TypeScript**:
   - **Razón**: Aporta tipado estático, previniendo errores en tiempo de compilación tanto para la lógica del framework como para el motor de físicas de juego.
3. **HTML5 Canvas (2D Context)**:
   - **Razón**: Proporciona un lienzo de dibujo de bajo nivel ideal para el gameplay a 60 FPS sin la sobrecarga del árbol DOM de los navegadores.
4. **Electron (v34+)**:
   - **Razón**: Permite empaquetar el juego web como una aplicación de escritorio nativa para Windows con acceso al sistema de archivos local y controles de ventana nativos.
5. **Web Audio API**:
   - **Razón**: Utilizada para la síntesis de sonido en tiempo real (\`MusicSynth\`), reduciendo el tamaño del paquete al no requerir archivos MP3/WAV pesados y permitiendo modular el audio según el estado del gameplay.
6. **Electron-Builder & Inno Setup**:
   - **Razón**: Automatizan la compilación y la empaquetadura en instaladores profesionales autoejecutables (.exe) para Windows.
`,

  '03_configuracion_instalacion.md': `# Configuración e Instalación

Sigue estos pasos para preparar el entorno de desarrollo y ejecutar o compilar el proyecto.

## Requisitos Previos
- **Node.js** v18.x o superior.
- **npm** (incluido con Node.js).

## Instalación de Dependencias
Ejecuta el siguiente comando en la raíz del proyecto para instalar las dependencias necesarias:
\`\`\`bash
npm install
\`\`\`

## Comandos de Ejecución

### Ejecución en Modo Web (Desarrollo)
Inicia el servidor de desarrollo de Angular en el puerto 3000 con recarga automática:
\`\`\`bash
npm run ng:start
\`\`\`
Abre tu navegador en [http://localhost:3000](http://localhost:3000).

### Ejecución en Modo Desktop (Electron)
Para iniciar el juego en la ventana nativa de Electron:
\`\`\`bash
npm start
\`\`\`

### Scripts Automatizados (Windows)
- \`INICIO_WEB.bat\`: Compila y lanza la versión web local.
- \`INICIO_DESKTOP.bat\`: Lanza la aplicación nativa a través de Electron en modo de desarrollo.
- \`MODO_DESARROLLADOR.bat\`: Inicia el entorno con herramientas y configuraciones de depuración activas.

## Compilación y Empaquetado
Para generar el ejecutable e instalador de Windows:
\`\`\`bash
npm run build
\`\`\`
El instalador generado se ubicará en la carpeta \`dist/\` con el nombre \`Xanezu_Catch_Setup_v1.8.0.exe\`.
`,

  '04_estructura_del_proyecto.md': `# Estructura del Proyecto

A continuación se detalla la organización de directorios y archivos principales del proyecto:

\`\`\`
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
\`\`\`
`,

  '05_logica_principal.md': `# Lógica Principal del Sistema

La ejecución de **Xanezu Catch** está controlada por la orquestación entre la UI en Angular y el Motor en Canvas a través del \`GameStateService\`.

## Flujo de Arranque y Ciclo de Vida del Juego

1. **BOOT**: La aplicación arranca, se inicializan configuraciones globales y se verifica la disponibilidad del entorno (web o desktop).
2. **MAIN_MENU**: Muestra la pantalla de inicio principal, permitiendo navegar a ajustes, tienda, selector de skins, trofeos o jugar.
3. **MODE_SELECT**: El usuario selecciona uno de los tres modos de juego: Historia, Arcade o Ablia.
4. **CHAPTER_SELECT**: El usuario selecciona el capítulo/nivel a jugar de una grilla de 16 niveles por modo (48 en total).
5. **LOADING_SCREEN**: Se instancia el componente de juego, se monta el lienzo Canvas y \`AssetLoader\` carga en memoria de manera asíncrona todas las imágenes necesarias para el nivel específico.
6. **PLAYING**: Se activa el loop de juego mediante \`requestAnimationFrame\`. El \`GameEngine\` actualiza los estados físicos y redibuja las entidades del canvas en cada frame.
7. **PAUSED**: El loop de juego se detiene visualmente y se muestra una capa DOM con opciones de reanudar, reiniciar o salir.
8. **GAME_OVER / VICTORY**: Al cumplir la condición de derrota (vidas = 0) o victoria, se cancela el loop de juego, se reportan las estadísticas y recompensas al \`GameDataService\`, y se vuelve al DOM para mostrar el resumen.
`,

  '06_funcionalidades.md': `# Funcionalidades Implementadas

El juego cuenta con un conjunto robusto de características diseñadas para maximizar el dinamismo y rejugabilidad:

1. **Tres Modos de Juego Autónomos**:
   - **Modo Historia**: 16 capítulos progresivos con música, narrativa y fondos específicos.
   - **Modo Arcade**: 16 capítulos con reglas de puntuación acelerada (12 desbloqueados inicialmente, 4 bloqueados).
   - **Modo Ablia**: 16 capítulos con desafíos temáticos avanzados.
2. **Sistema de Progresión e XP**:
   - Curva de subida de nivel del 1 al 30, requiriendo hasta 350.000 puntos acumulados en total.
3. **Tienda y Personalización**:
   - Selector de skins para el personaje y compra de mejoras (Power-Ups) utilizando las gemas ganadas.
4. **Audio Dinámico Sintetizado**:
   - Control de volumen (música y efectos) y botón de silencio rápido (ON/OFF).
   - Síntesis de notas en tiempo real para evitar la dependencia de archivos de sonido externos.
5. **Mecánica de Combos y Power-Ups**:
   - **Bananas Combo**: Al recolectar 5 bananas, limpia la pantalla de obstáculos con efectos visuales y otorga inmunidad temporal.
   - **Chuches Combo**: Acumula y clasifica visualmente los dulces recolectados en pantalla en una grilla dinámica de 10 slots.
   - **Multiplicador**: Incrementa los puntos obtenidos y se acumula temporalmente al recolectar multiplicadores (\`x2\`, \`x4\`, \`x8\`, etc.).
   - **Vida Extra**: Grilla de 10 corazones que al completarse otorga una vida adicional.
`,

  '07_flujo_de_datos.md': `# Flujo de Datos

El intercambio de información entre las capas Angular y el motor Canvas se mantiene desacoplado mediante el uso de servicios compartidos y patrones de mensajería asíncronos.

## Flujo de Datos del Gameplay

\`\`\`
[Canvas (Gameplay)] 
       │
       ▼ (Eventos / Colisiones)
[GameEngine] 
       │
       ▼ (Actualiza Datos de Partida: Puntos, Vidas, Combos)
[GameDataService] (Guarda en localStorage / Memoria)
       │
       ▼ (Notifica cambios a través de Signals / RxJS)
[UI Components (Angular DOM HUD)]
\`\`\`

1. **Inicialización**: Al seleccionar un nivel, \`GameStateService\` establece el capítulo activo. \`AssetLoader\` carga los datos de configuración del nivel y sus dependencias de imágenes.
2. **Gameplay Loop**: El motor Canvas lee entradas del teclado mediante eventos de escucha de ventana. Modifica las posiciones de las entidades y procesa colisiones.
3. **Actualización del Estado**: Al colisionar con una banana o chuche, el motor notifica al \`GameDataService\` y actualiza las puntuaciones, multiplicadores y grillas de combos correspondientes.
4. **Sincronización HUD**: Los componentes del HUD Angular, enlazados reactivamente a las señales del servicio de datos, actualizan instantáneamente sus barras de progreso, marcadores y ranuras de combo de manera visual sin necesidad de redibujar la UI en el canvas.
5. **Persistencia**: Al finalizar el nivel, las puntuaciones altas, gemas obtenidas y rangos desbloqueados se guardan localmente en el \`localStorage\` del dispositivo para que el progreso se mantenga al reiniciar la aplicación.
`,

  '08_endpoints_api.md': `# Endpoints de API

*No Aplica.*

**Xanezu Catch** es una aplicación completamente cliente, autoejecutable tanto en web como en Electron, que no depende de servidores externos ni APIs REST para su funcionamiento básico. Todo el procesamiento de datos, físicas y renderizado se realiza localmente en el dispositivo del usuario. El progreso se persiste localmente a través de las APIs estándar del navegador (\`localStorage\`).
`,

  '09_base_de_datos.md': `# Base de Datos y Persistencia

El almacenamiento de información de progreso y configuraciones del jugador se realiza de forma local y persistente.

## Sistema de Persistencia: LocalStorage

Los datos se serializan y guardan bajo una clave estructurada de almacenamiento web local:

- **Estructura de Datos Guardada**:
  - \`xp\`: Puntos de experiencia totales del jugador (utilizados en la curva de progresión).
  - \`level\`: Nivel de perfil alcanzado (1 al 30).
  - \`gems\`: Cantidad de gemas disponibles para comprar skins o mejoras.
  - \`unlockedChapters\`: Lista de identificadores de capítulos desbloqueados en los modos Historia, Arcade y Ablia.
  - \`purchasedSkins\`: Colección de skins compradas en la tienda.
  - \`currentSkin\`: La apariencia seleccionada y activa para el personaje jugador.
  - \`settings\`: Configuración de volumen de música, efectos de sonido y estado de habilitación de audio.

Esta estructura se actualiza en tiempo real al finalizar un nivel, comprar una skin en la tienda o cambiar las configuraciones de volumen en el menú de opciones.
`,

  '10_gestion_de_estado.md': `# Gestión de Estado

La gestión de estado del juego está centralizada para garantizar que la interfaz Angular y el bucle del Canvas actúen de manera coordinada.

## Herramientas Utilizadas
- **Angular Signals**: Proporcionan reactividad fina y actualizaciones ultra rápidas del DOM para elementos de la interfaz como el HUD, barra de vida y combos.
- **RxJS BehaviorSubjects**: Utilizados para gestionar el flujo de navegación principal debido a su facilidad para manejar eventos asíncronos y mantener el último estado de forma persistente.

## Sincronización entre Angular y Canvas
Cuando el estado cambia a \`PLAYING\`, se monta el componente \`GameCanvasComponent\`. Al montarse, obtiene el contexto 2D del Canvas e instancia el \`GameEngine\`. Al destruirse el componente Angular (por ejemplo, al volver al menú principal), se detiene el \`requestAnimationFrame\`, se limpian los eventos del teclado y se liberan las referencias de memoria para evitar fugas de recursos.
`,

  '11_ui_ux.md': `# Diseño de Interfaz y Experiencia de Usuario (UI/UX)

**Xanezu Catch** prioriza una estética visual vibrante y moderna que responde instantáneamente a las acciones del jugador.

## Elementos y Estilo Visual
- **Temática Retro-Futurista y Glassmorphism**: Uso de fondos oscuros, gradientes de neón, desenfoque de fondo (\`backdrop-filter\`) y bordes semitransparentes brillantes para lograr un diseño limpio y moderno.
- **HUD Superior e Inferior Simétrico**: El contenedor superior que aloja el nivel, combo de bananas, combo de chuches y el multiplicador posee una altura simétrica con respecto al panel inferior del juego, optimizando la visibilidad del Canvas central.
- **Pantalla de Carga Interactiva**: Proporciona una barra de progreso que indica el porcentaje exacto de carga de assets, mostrando logs dinámicos de los archivos que están siendo procesados antes de iniciar el nivel.

## Sonido y Feedback UX
- **Audio Desbloqueado Estilo Moderno**: En cumplimiento con las directivas de los navegadores, el audio se inicializa bloqueado. Al primer clic del usuario, se muestra una animación suave con un mini-tooltip indicando "Audio Desbloqueado".
- **Botón de Audio Rápido**: Disponible en el menú principal y opciones para activar/desactivar la música y los efectos sonoros con un solo clic.
`,

  '12_mecanicas_del_juego.md': `# Mecánicas del Juego

La jugabilidad de **Xanezu Catch** está diseñada bajo un enfoque arcade dinámico y ágil, centrado en físicas fluidas en 2D.

## Físicas y Movimiento
- **Control del Jugador**: El personaje se desplaza horizontalmente con fuerzas de inercia y fricción en el eje X, logrando deslizamientos suaves.
- **Salto y Gravedad**: Sistema de saltos con gravedad constante. El personaje puede saltar para alcanzar premios elevados o esquivar obstáculos.
- **Colisiones**: Caja de colisión rectangular (AABB) simplificada para garantizar que la detección a 60 FPS sea eficiente e instantánea.

## Mecánicas de Combo
- **Bananas Combo**: Al recolectar 5 bananas, se produce una detonación visual en el lienzo y todos los obstáculos en pantalla explotan durante 1.5 segundos antes de ser eliminados. El jugador es invulnerable durante este proceso.
- **Chuches Combo**: Una grilla de 5x2 slots almacena visualmente las chuches recolectadas, ofreciendo recompensas o bonificaciones de puntuación al completarse.
- **Vida Extra**: Al recolectar corazones en juego se va completando una grilla de 10 slots en miniatura. Al llenarse, otorga un corazón adicional a la barra de vidas principal.
- **Multiplicador de Puntos**: Recoger multiplicadores incrementa temporalmente el multiplicador (\`x2\`, \`x4\`, \`x8\`, etc.) por 30 segundos, reiniciando la cuenta atrás si se consigue otro multiplicador antes de que el tiempo expire.
`,

  '13_archivos_de_configuracion.md': `# Archivos de Configuración

El proyecto cuenta con varios archivos de configuración que rigen el comportamiento del compilador, el framework y el entorno Electron:

1. **\`angular.json\`**:
   - Define el espacio de trabajo de Angular, especificando la configuración de construcción, compilación, rutas de salida de assets y estilos globales (\`src/styles.css\`).
2. **\`tsconfig.json\` y \`tsconfig.app.json\`**:
   - Configuran el compilador de TypeScript. Habilitan el modo estricto de tipado y definen la ruta de destino de compilación (ES2022/Module).
3. **\`electron_main.js\`**:
   - Archivo de configuración e inicio de Electron. Define el tamaño de la ventana nativa (por defecto optimizada para resoluciones HD/FullHD), las directivas de seguridad (desactivación de nodeIntegration y activación de contextIsolation) y carga el archivo HTML compilado de Angular.
4. **\`package.json\`**:
   - Almacena metadatos del proyecto (versión 1.8.0), dependencias y los comandos de automatización (\`build\`, \`start\`, \`test\`).
`,

  '14_variables_de_entorno.md': `# Variables de Entorno

*No Aplica.*

El juego está diseñado para ejecutarse localmente sin depender de variables de entorno complejas (\`.env\`). Los parámetros ajustables como la velocidad del juego, gravedad base, valores de XP y configuración de niveles se definen directamente en constantes tipadas de TypeScript dentro de:
- \`src/app/core/constants/chapters.constants.ts\`
- \`src/app/game/engine/engine.constants.ts\`

Esto asegura que el juego sea portable y no requiera inyección de dependencias ambientales durante el despliegue web o la instalación de escritorio.
`,

  '15_pruebas.md': `# Estrategia de Pruebas

Para garantizar que el motor físico y la lógica de puntuación funcionen correctamente antes de cada compilación, se cuenta con una suite de pruebas estructurada.

## Pruebas de Lógica de Juego
Las pruebas unitarias están diseñadas para validar:
- La correcta actualización del XP del jugador basándose en la tabla de progresión.
- La lógica de subida de nivel (de 0 a nivel 30).
- La validación del sistema de combos y el reinicio de multiplicadores al expirar el tiempo de 30 segundos.

## Ejecución de Pruebas
Puedes correr la suite de pruebas unitarias ejecutando:
\`\`\`bash
npm run test
\`\`\`
Esta prueba ejecuta \`tests/logic.test.mjs\` que valida la consistencia algorítmica de los servicios principales sin requerir renderizado visual.
`,

  '16_rendimiento.md': `# Consideraciones de Rendimiento

El rendimiento es crítico en **Xanezu Catch** para mantener los 60 FPS estables en múltiples dispositivos.

## Optimización de Renderizado en Canvas
- **Renderizado Condicional**: El motor de juego solo ejecuta el bucle de renderizado cuando el estado del juego es \`PLAYING\`, evitando el consumo innecesario de CPU y GPU en menús estáticos.
- **Sistema de Partículas Acotado**: Las explosiones de partículas limitan la cantidad de entidades activas simultáneamente en pantalla para evitar caídas de rendimiento en dispositivos de gama baja.
- **No Manipulación del DOM en Gameplay**: El gameplay no genera ni destruye elementos DOM. Las posiciones se calculan en memoria y se dibujan directamente en el canvas.

## Optimización de Assets
- **Formato WebP**: Los fondos de juego (\`fondo_intermedio.webp\`) y elementos gráficos se almacenan en formato WebP para minimizar el peso del archivo de distribución y acelerar los tiempos de carga en la web.
- **Audio Sintetizado**: Al no descargar archivos de audio pesados en formato MP3 o WAV, la carga inicial es prácticamente instantánea.
`,

  '17_seguridad.md': `# Medidas de Seguridad

El empaquetado desktop a través de Electron incluye configuraciones de seguridad estándar para aislar el proceso de renderizado del sistema operativo:

1. **Aislamiento de Contexto (\`contextIsolation: true\`)**:
   - Asegura que los scripts cargados en el renderizador del juego no tengan acceso directo a las APIs internas de Node.js o Electron.
2. **Desactivación de Node en Renderizador (\`nodeIntegration: false\`)**:
   - Evita la ejecución de comandos del sistema desde la consola de desarrollo del juego.
3. **Puente Seguro (\`preload.js\`)**:
   - Define un puente seguro controlado para exponer funciones esenciales (como salir de la aplicación o interactuar con el guardado) sin comprometer la seguridad del sistema anfitrión.
`,

  '18_despliegue.md': `# Guía de Despliegue

El proyecto se puede desplegar tanto en servidores web estáticos como distribuirse en instaladores de escritorio nativos.

## Despliegue Web
1. Compila el proyecto Angular en modo producción:
   \`\`\`bash
   npm run ng:build
   \`\`\`
2. Los archivos resultantes se encontrarán en \`dist/xanezu-app/browser/\`.
3. Sube este directorio a cualquier servicio de alojamiento estático (Vercel, Netlify, GitHub Pages, Firebase Hosting, etc.).

## Despliegue de Escritorio (Windows)
1. Para generar el instalador ejecutable de Windows, corre:
   \`\`\`bash
   npm run build
   \`\`\`
2. El script compilará la aplicación Angular, empaquetará los assets usando Electron y luego invocará a \`electron-builder\` para generar el archivo de instalación autoejecutable.
3. El instalador resultante estará disponible en la raíz en la carpeta \`dist/\`.
`,

  '19_problemas_conocidos.md': `# Problemas Conocidos

A continuación se listan algunas limitaciones o problemas conocidos identificados en el sistema:

1. **Bloqueo Inicial de Audio en Navegadores**:
   - Los navegadores modernos prohíben la reproducción de audio sintético o archivos de música antes de que el usuario realice una interacción física (clic/toque). El juego maneja esto mostrando un aviso interactivo para desbloquear el audio limpiamente.
2. **Pérdida de Foco en Electron**:
   - Al cambiar de ventana en Windows (Alt+Tab), la música sintetizada puede pausarse abruptamente o acelerarse al reanudar el foco debido a cómo el navegador web y Electron gestionan los contadores de tiempo en segundo plano. Se recomienda pausar el juego antes de cambiar de ventana.
3. **Persistencia Compartida**:
   - Ejecutar la versión web y de escritorio en la misma máquina no comparte el progreso, dado que Electron posee su propio almacén de LocalStorage aislado del navegador web del usuario.
`,

  '20_mejoras_futuras.md': `# Mejoras Futuras

Se contemplan las siguientes características y optimizaciones para futuras versiones del juego:

1. **Tabla de Clasificación en Línea (Online Leaderboard)**:
   - Integración con un servicio en la nube (como Firebase o supabase) para registrar las puntuaciones más altas de los jugadores a nivel global.
2. **Soporte para Gamepads**:
   - Implementación de la API de Gamepad del navegador para permitir el control completo del juego con mandos de Xbox o PlayStation.
3. **Nuevos Modos de Juego**:
   - Implementación de desafíos diarios y modo contrarreloj con físicas modificadas.
4. **Logros Integrados**:
   - Creación de un sistema de logros visuales que desbloquee skins exclusivas al realizar jugadas complejas (por ejemplo: ganar un capítulo sin perder vidas).
`,

  '99_glosario.md': `# Glosario de Términos

- **AABB (Axis-Aligned Bounding Box)**: Caja de colisión rectangular alineada con los ejes cartesianos, utilizada para calcular intersecciones rápidas entre el jugador y los objetos.
- **Angular Signal**: Reactividad de granularidad fina introducida en Angular que notifica cambios de estado directamente a las partes del DOM que los consumen.
- **AssetLoader**: Módulo encargado de la descarga y almacenamiento en caché de imágenes y recursos gráficos del juego de forma asíncrona antes del inicio de cada nivel.
- **Canvas**: Elemento de HTML5 que permite dibujar gráficos 2D o 3D dinámicamente mediante código JavaScript/TypeScript.
- **Electron**: Framework que permite desarrollar aplicaciones de escritorio multiplataforma utilizando tecnologías web (HTML, CSS, JS).
- **Glassmorphism**: Estilo de diseño de interfaz de usuario caracterizado por la apariencia de vidrio translúcido o esmerilado, logrado mediante desenfoque y colores semitransparentes.
- **HUD (Heads-Up Display)**: Panel de información visual superpuesto en pantalla que muestra el estado actual del jugador (vidas, nivel, puntuación, combos).
- **MusicSynth**: Sintetizador de audio personalizado implementado con Web Audio API que genera ondas de sonido (sinusoidales, cuadradas, etc.) dinámicamente.
- **XP (Experience Points)**: Puntos acumulativos que representan el progreso general del jugador y determinan su nivel en el juego.
`
};

for (const [filename, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(docsDir, filename), content.trim() + '\\n');
}
console.log('Documentation generated successfully.');
