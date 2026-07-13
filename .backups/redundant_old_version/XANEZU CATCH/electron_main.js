const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        title: "Xanezu Catch",
        icon: path.join(__dirname, 'assets/favicon_frog.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        },
        backgroundColor: '#000000',
        show: false // Don't show until ready-to-show
    });

    // Remove menu bar for a clean arcade look
    Menu.setApplicationMenu(null);

    mainWindow.loadFile('index.html');

    // Smooth show
    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
    });

    // Option to open dev tools for debugging (remove in final or use shortcut)
    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
