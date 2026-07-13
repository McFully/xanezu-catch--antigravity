# Medidas de Seguridad

El empaquetado desktop a través de Electron incluye configuraciones de seguridad estándar para aislar el proceso de renderizado del sistema operativo:

1. **Aislamiento de Contexto (`contextIsolation: true`)**:
   - Asegura que los scripts cargados en el renderizador del juego no tengan acceso directo a las APIs internas de Node.js o Electron.
2. **Desactivación de Node en Renderizador (`nodeIntegration: false`)**:
   - Evita la ejecución de comandos del sistema desde la consola de desarrollo del juego.
3. **Puente Seguro (`preload.js`)**:
   - Define un puente seguro controlado para exponer funciones esenciales (como salir de la aplicación o interactuar con el guardado) sin comprometer la seguridad del sistema anfitrión.\n