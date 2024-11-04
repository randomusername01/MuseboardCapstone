const { ipcRenderer } = require('electron');

// Minimize window and show the button on side.
document.getElementById('minimizeButton').addEventListener('click', () => {
    console.log('button clicked');
    ipcRenderer.send('minimize-to-button');
});