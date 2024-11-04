const { ipcRenderer } = require('electron');

const panel = document.querySelector('.panel');
const toggleButton = document.getElementById('toggleButton');

let isPanelVisible = false;

toggleButton.innerHTML = isPanelVisible ? '→' : '←';

function togglePanel() {
    isPanelVisible = !isPanelVisible;

    if (isPanelVisible) {
        panel.classList.add('visible');
        toggleButton.innerHTML = '→'; 
    } else {
        panel.classList.remove('visible');
        toggleButton.innerHTML = '←'; 
    }

    ipcRenderer.send('toggle-panel', isPanelVisible);
}

toggleButton.addEventListener('click', togglePanel);
