const { app, BrowserWindow, ipcMain, screen, Menu, dialog } = require("electron");
const path = require("path");
const fs = require('fs');
const settings = require("electron-settings");
const AutoLaunch = require("auto-launch");

const settingsFile = path.join(app.getPath('userData'), 'window-settings.json');
const ICON_PATH = path.join(__dirname, "assets/icons/museboard-icon.png");
const AUTO_LAUNCH_NAME = "MuseBoard";
const DEFAULT_SETTINGS = { launchOnStart: false, darkMode: false };

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

const setAutoLaunch = async (enabled) => {
  try {
    if (enabled) {
      await autoLauncher.enable();
    } else {
      await autoLauncher.disable();
    }
    console.log(`AUTO LAUNCH ${enabled ? "ENABLED" : "DISABLED"}`);
  } catch (error) {
    if (!error.message.includes("Can’t get login item")) {
      console.error("Failed to set auto-launch:", error);
    }
  }
};

async function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().size;
  const defaultSize = { width: 465, height: screenHeight };
  let winSize = defaultSize;

  try {
    const raw = fs.readFileSync(settingsFile, 'utf8');
    winSize = JSON.parse(raw);
    if (winSize.width < 100) winSize.width = defaultSize.width;
  } catch {}

  const currentSettings = await settings.get();
  let expandedWidth = winSize.width;

  mainWindow = new BrowserWindow({
    width: winSize.width,
    height: winSize.height,
    x: screenWidth - winSize.width,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    icon: ICON_PATH,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });

  mainWindow.loadFile('index.html');
  // mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('apply-settings', currentSettings);
  });

  mainWindow.on("resize", () => {
    const [w, h] = mainWindow.getSize();
    if (w < 100) return;
    expandedWidth = w;
    fs.writeFileSync(settingsFile, JSON.stringify({ width: w, height: h }));
  });

  mainWindow.on("close", () => {
    const [w, h] = mainWindow.getSize();
    if (w >= 100) {
      expandedWidth = w;
      fs.writeFileSync(settingsFile, JSON.stringify({ width: w, height: h }));
    }
  });

  ipcMain.on("toggle-panel", (event, isVisible) => {
    let w = isVisible ? expandedWidth : 60;
    if (isVisible && w < 100) w = defaultSize.width;

    mainWindow.setBounds({
      x: screenWidth - w,
      width: w,
      height: screenHeight,
      y: 0,
    });

    if (isVisible) {
      fs.writeFileSync(
        settingsFile,
        JSON.stringify({ width: w, height: screenHeight })
      );
    }
  });

  ipcMain.on('open-theme-customizer', () => {
    modalWindow = new BrowserWindow({
      parent: mainWindow,
      modal: true,
      width: 400,
      height: 300,
      resizable: false,
      webPreferences: { nodeIntegration: true, contextIsolation: false },
    });
    modalWindow.loadFile('theme-customizer.html');
    ipcMain.once('close-window', () => modalWindow?.close());
    mainWindow.webContents.send('hide-settings-dropdown');
  });
}

const setupIpcHandlers = () => {
  ipcMain.handle("get-settings", async () => await settings.get());
  ipcMain.handle("save-setting", async (e, key, value) => {
    await settings.set(key, value);
    console.log(`Saved setting ${key} with value ${value}`);
  });
  ipcMain.on("toggle-launch-on-startup", (e, isEnabled) => setAutoLaunch(isEnabled));
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

  ipcMain.handle("save-board", async (e, data) => {
    const suggestedName = data.title && data.title.trim() !== ""
      ? data.title
      : "board1";

    const { canceled, filePath } = await dialog.showSaveDialog({
      filters: [{ name: "MuseBoard Files", extensions: ["board"] }],
      defaultPath: suggestedName + ".board",
    });

    if (canceled || !filePath) {
      return { success: false, error: "User canceled save dialog." };
    }

    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

      const metadataPath = path.join(app.getPath("userData"), "boards-metadata.json");
      let boardsMetadata = [];

      if (fs.existsSync(metadataPath)) {
        boardsMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
      }

      let entry = boardsMetadata.find((b) => b.filePath === filePath);
      if (!entry) {
        entry = { filePath };
        boardsMetadata.push(entry);
      }

      entry.title = data.title || path.basename(filePath);
      entry.tags = data.tags || [];
      const thumb = data.canvasState?.thumbnailBase64 || null;
      entry.thumbnailBase64 = thumb;

      fs.writeFileSync(metadataPath, JSON.stringify(boardsMetadata, null, 2), "utf-8");

      return { success: true, filePath };
    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("edit-board-metadata", async (e, { filePath, title, tags }) => {
    try {
      const metadataPath = path.join(app.getPath("userData"), "boards-metadata.json");
      let boardsMetadata = [];
      if (fs.existsSync(metadataPath)) {
        boardsMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
      }

      const entry = boardsMetadata.find((b) => b.filePath === filePath);
      if (!entry) {
        return { success: false, error: "No existing board entry found." };
      }

      entry.title = title;
      entry.tags = tags;

      fs.writeFileSync(metadataPath, JSON.stringify(boardsMetadata, null, 2), "utf-8");

      return { success: true };
    } catch (error) {
      console.error("Error editing metadata:", error);
      return { success: false, error: error.message };
    }
  });

  let boardsMetadata = [];

  ipcMain.handle('get-all-boards-metadata', async () => {
    try {
      const metadataPath = path.join(app.getPath('userData'), 'boards-metadata.json');
      if (fs.existsSync(metadataPath)) {
        const raw = fs.readFileSync(metadataPath, 'utf-8');
        boardsMetadata = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading boards-metadata.json:', err);
    }

    return boardsMetadata;
  });

  ipcMain.on('open-specific-board', (event, filePath) => {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const boardData = JSON.parse(fileContent);
      mainWindow.webContents.send('load-board-data', boardData);

      if (modalWindow) modalWindow.close();
    } catch (err) {
      console.error('Error opening specific board:', err);
    }
  });

  ipcMain.on("reset-window-size", () => {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().size;
    const defaultSize = { width: 465, height: screenHeight };
    mainWindow.setBounds({ x: screenWidth - defaultSize.width, ...defaultSize, y: 0 });
    try {
      fs.writeFileSync(settingsFile, JSON.stringify(defaultSize));
    } catch (err) {
      console.error("Failed to write reset size:", err);
    }
  });
};

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  setDefaultSettings();
  setupIpcHandlers();
  await createWindow();
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

function openCustomFileBrowser() {
  if (modalWindow) {
    modalWindow.close();
  }

  modalWindow = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    width: 600,
    height: 500,
    resizable: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  modalWindow.loadFile('custom-file-browser.html');

  modalWindow.on('closed', () => {
    modalWindow = null;
  });
}

function generateThumbnail(canvas) {
  const tempCanvas = document.createElement('canvas');
  const tctx = tempCanvas.getContext('2d');

  const width = 200;
  const scale = width / canvas.width;
  const height = canvas.height * scale;
  tempCanvas.width = width;
  tempCanvas.height = height;

  tctx.drawImage(canvas, 0, 0, width, height);
  return tempCanvas.toDataURL('image/png');
}

ipcMain.on('open-custom-browser', () => {
  openCustomFileBrowser();
});