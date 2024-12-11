const { app, BrowserWindow, ipcMain, screen, Menu, dialog } = require("electron");
const path = require("path");
const fs = require('fs');
const settings = require("electron-settings");
const AutoLaunch = require("auto-launch");

const ICON_PATH = path.join(__dirname, "assets/icons/museboard-icon.png");
const AUTO_LAUNCH_NAME = "MuseBoard";
const DEFAULT_SETTINGS = {
  launchOnStart: false,
  darkMode: false,
};

let mainWindow;
let modalWindow;

const autoLauncher = new AutoLaunch({
  name: AUTO_LAUNCH_NAME,
  path: app.getPath("exe"),
});

const setDefaultSettings = () => {
  Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
    if (!settings.hasSync(key)) {
      settings.setSync(key, value);
    }
  });
};

const setAutoLaunch = (enabled) => {
  enabled ? autoLauncher.enable() : autoLauncher.disable();
  console.log(`AUTO LAUNCH ${enabled ? "ENABLED" : "DISABLED"}`);
};

async function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const panelWidth = Math.floor(width / 3) - 40;
  const currentSettings = await settings.get();

  mainWindow = new BrowserWindow({
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

  mainWindow.loadFile("index.html");

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("apply-settings", currentSettings);
  });

  ipcMain.on("open-theme-customizer", () => {
    
    modalWindow = new BrowserWindow({
      parent: mainWindow,
      modal: true,
      width: 400,
      height: 300,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    modalWindow.loadFile("theme-customizer.html");

   
    ipcMain.once("close-window", () => {
      if (modalWindow) {
        modalWindow.close();
      }
    });
  });

  
  ipcMain.on("toggle-panel", (event, isVisible) => {
    mainWindow.setBounds({
      x: isVisible ? width - panelWidth - 60 : width - 60,
      width: isVisible ? panelWidth + 60 : 60,
      height,
    });
  });
}

const setupIpcHandlers = () => {
  ipcMain.handle("get-settings", async () => await settings.get());
  ipcMain.handle("save-setting", async (e, key, value) => {
    await settings.set(key, value);
    console.log(`Saved setting ${key} with value ${value}`);
  });
  ipcMain.on("toggle-launch-on-startup", (e, isEnabled) =>
    setAutoLaunch(isEnabled)
  );
  ipcMain.on("update-theme-colors", (e, newPrimaryColor, newSecondaryColor) => {
    if (mainWindow) {
      mainWindow.webContents.send(
        "update-theme-colors",
        newPrimaryColor,
        newSecondaryColor
      );
    }
  });
  ipcMain.handle('open-board-file', async (e) => {
    try {
      const result = await dialog.showOpenDialog({
        filters: [{ name: 'Board Files', extensions: ['board'] }],
        properties: ['openFile']
      });
  
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false };
      }
  
      const filePath = result.filePaths[0];
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const boardData = JSON.parse(fileContent);
  
      
      e.sender.send('load-board-data', boardData);
      return { success: true };
    } catch (error) {
      console.error('Error opening board file:', error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle('save-board', async (e, data) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      filters: [
        { name: "MuseBoard Files", extensions: ['board'] }
      ],
      defaultPath: 'board1.board'
    });

    if (canceled || !filePath) return { success:false };

    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true, filePath };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  });
};

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  setDefaultSettings();
  setupIpcHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle("select-file", async (event, fileType) => {
  const filters = [
    { name: "Images", extensions: ["jpg", "png", "jpeg"] },
    { name: "GIFs", extensions: ["gif"] },
  ];

  const selectedFilter = fileType === "image" ? filters[0] : filters[1];

  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [selectedFilter],
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});