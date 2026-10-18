import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// --- CONFIGURACIÓN ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- SISTEMA DE LOGS PROFESIONAL (Protocolo Universal) ---
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

function writeLog(type, data) {
    const timestamp = new Date().toISOString();
    const fileName = `${type}.log`;
    const filePath = path.join(LOG_DIR, fileName);
    const logEntry = `[${timestamp}] ${JSON.stringify(data)}\n`;
    
    try {
        fs.appendFileSync(filePath, logEntry);
    } catch (e) {
        console.error("Error writing log:", e);
    }
    console.log(`[LOG:${type.toUpperCase()}] ${logEntry.trim()}`);
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        title: "Xanezu Catch",
        icon: path.join(__dirname, 'assets/menu/favicon_frog.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, 'preload.js')
        },
        backgroundColor: '#000000',
        show: false
    });

    Menu.setApplicationMenu(null);
    
    // Ruta a la compilación de Angular (dist/xanezu-app/browser/index.html)
    const indexPath = path.join(__dirname, 'dist', 'xanezu-app', 'browser', 'index.html');
    
    // Si el archivo existe lo cargamos (Producción/Build), si no, avisamos
    if (fs.existsSync(indexPath)) {
        mainWindow.loadFile(indexPath);
    } else {
        mainWindow.loadURL('http://localhost:3000').catch(() => {
            writeLog('error', { event: 'critical_failure', msg: 'Angular build not found and dev server inactive on port 3000.' });
        });
    }


    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
    });
}

// --- IPC HANDLERS ---
ipcMain.on('app:log', (event, { type, data }) => {
    writeLog(type || 'general', data);
});

ipcMain.handle('app:get-version', () => app.getVersion());

app.whenReady().then(() => {
    // Log inicial de arranque
    writeLog('startup', { version: app.getVersion(), platform: process.platform, arch: process.arch });
    
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    writeLog('startup', { event: 'shutdown', status: 'normal' });
    if (process.platform !== 'darwin') app.quit();
});
