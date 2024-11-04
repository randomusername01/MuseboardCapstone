const path = require('path');
const { app, BrowserWindow, ipcMain, screen } = require('electron');


// Require electron module to reload when file changes saved.
require('electron-reload')(path.join(__dirname));


let mainWindow;
let miniButtonWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html')
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

// IPC listener to minimize the window.
ipcMain.on('minimize-to-button', (e) => {
    // Hide the main window.
    mainWindow.hide();

    // Getting the display width and height.
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    // Defining the window size for mini window.
    const windowWidth = 70;
    const windowHeight = 70;

    // Calculating the x and y positions to center window vertically and align to right side.
    const xPos = width - windowWidth;
    const yPos = (height - windowHeight) / 2;

    // Creating mini window for button.
    miniButtonWindow = new BrowserWindow({
      width: 70,
      height: 70,
      x: xPos,
      y: yPos,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    miniButtonWindow.loadFile('mini-button.html');

    // Closing mini window when clicking button and restoring the main window.
    miniButtonWindow.on('closed', () => {
        mainWindow.show();
        miniButtonWindow = null;
    })
});

// IPC listener to restore the main window.
ipcMain.on('restore-main-window', () => {
    if (mainWindow) {
      mainWindow.show();
      miniButtonWindow.close();
    }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
