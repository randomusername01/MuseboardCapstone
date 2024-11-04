const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

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
      mainWindow.setBounds({ x: width - panelWidth - 60, width: panelWidth + 60, height }); 
    } else {
      mainWindow.setBounds({ x: width - 60, width: 60, height }); 
    }
  });
}

app.on('ready', createWindow);

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
