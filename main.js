const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const settings = require('electron-settings');
const AutoLaunch = require('auto-launch');

const ICON_PATH = path.join(__dirname, 'assets/icons/museboard-icon.png');
const AUTO_LAUNCH_NAME = 'MuseBoard';
const DEFAULT_SETTINGS = {
  launchOnStart: false,
  darkMode: false,
  autoSave: false
};

// Initialize AutoLaunch
const autoLauncher = new AutoLaunch({
  name: AUTO_LAUNCH_NAME,
  path: app.getPath('exe')
});

// Set default settings if not already set
const setDefaultSettings = () => {
  Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
    if (!settings.hasSync(key)) {
      settings.setSync(key, value);
    }
  });
};

// Auto-launch enable/disable function
const setAutoLaunch = (enabled) => {
  enabled ? autoLauncher.enable() : autoLauncher.disable();
  console.log(`AUTO LAUNCH ${enabled ? 'ENABLED' : 'DISABLED'}`);
};

// Create main window
async function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const panelWidth = Math.floor(width / 3) - 40;
  const currentSettings = await settings.get();

  const mainWindow = new BrowserWindow({
    width: 60,
    height,
    icon: ICON_PATH,
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

  // Send settings to renderer after window is loaded
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('apply-settings', currentSettings);
  });

  // Handle panel toggle
  ipcMain.on('toggle-panel', (event, isVisible) => {
    mainWindow.setBounds({
      x: isVisible ? width - panelWidth - 60 : width - 60,
      width: isVisible ? panelWidth + 60 : 60,
      height,
    });
  });

  return mainWindow;
}

// IPC Handlers
const setupIpcHandlers = () => {
  ipcMain.handle('get-settings', async () => await settings.get());
  ipcMain.handle('save-setting', async (e, key, value) => {
    await settings.set(key, value);
    console.log(`Saved setting ${key} with value ${value}`);
  });
  ipcMain.on('toggle-launch-on-startup', (e, isEnabled) => setAutoLaunch(isEnabled));
};

// Electron App Lifecycle
app.whenReady().then(() => {
  setDefaultSettings();
  setupIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
