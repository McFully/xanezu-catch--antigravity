import { contextBridge, ipcRenderer } from 'electron';

/**
 * Bridge seguro entre el Renderer (Canvas) y el Main Process (Node.js).
 * Expone funcionalidades mínimas para mantener la seguridad (Sandbox).
 */
contextBridge.exposeInMainWorld('electronAPI', {
    /**
     * Envía una entrada de log al proceso principal para su escritura persistente.
     * @param {string} type - Tipo de log (startup, error, audit, evolution).
     * @param {object} data - Datos a registrar.
     */
    log: (type, data) => ipcRenderer.send('app:log', { type, data }),
    
    /**
     * Permite solicitar la versión del sistema.
     */
    getAppVersion: () => ipcRenderer.invoke('app:get-version')
});
