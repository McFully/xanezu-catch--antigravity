# Archivos de Configuración

El proyecto cuenta con varios archivos de configuración que rigen el comportamiento del compilador, el framework y el entorno Electron:

1. **`angular.json`**:
   - Define el espacio de trabajo de Angular, especificando la configuración de construcción, compilación, rutas de salida de assets y estilos globales (`src/styles.css`).
2. **`tsconfig.json` y `tsconfig.app.json`**:
   - Configuran el compilador de TypeScript. Habilitan el modo estricto de tipado y definen la ruta de destino de compilación (ES2022/Module).
3. **`electron_main.js`**:
   - Archivo de configuración e inicio de Electron. Define el tamaño de la ventana nativa (por defecto optimizada para resoluciones HD/FullHD), las directivas de seguridad (desactivación de nodeIntegration y activación de contextIsolation) y carga el archivo HTML compilado de Angular.
4. **`package.json`**:
   - Almacena metadatos del proyecto (versión 1.8.0), dependencias y los comandos de automatización (`build`, `start`, `test`).\n