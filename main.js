const { app, BrowserWindow, ipcMain, screen } = require('electron');
const settings = require('electron-settings');

// Defining default settings
const defaultSettings = {
  launchOnStart: false,
  darkMode: false,
  autoSave: false,
  customTheme: false
};

// Checking if settings are set and assign default settings if not set
for (const [key, value] of Object.entries(defaultSettings)) {
  if (!settings.hasSync(key)) {
    settings.setSync(key, value);
  }
}

let mainWindow;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const panelWidth = Math.floor(width / 3) - 40;

  mainWindow = new BrowserWindow({
    width: 60,
    height,
    x: width - 60,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');

  ipcMain.on('toggle-panel', (event, isVisible) => {
    if (isVisible) {
      mainWindow.setBounds({
        x: width - panelWidth - 60,
        width: panelWidth + 60,
        height,
      });
    } else {
      mainWindow.setBounds({
        x: width - 60,
        width: 60,
        height,
      });
    }
  });
}

app.whenReady().then(async () => {
  // IPC handler for getting settings
  ipcMain.handle('get-settings', async () => {
    const allSettings = await settings.get();
    return allSettings;
  });

  // IPC handler for saving individual settings
  ipcMain.handle('save-setting', async (e, key, value) => {
    await settings.set(key, value);
    console.log(`Saved setting ${key} with value ${value}`);
  })

  // Creating the main window.
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
