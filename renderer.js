const { ipcRenderer } = require('electron');

const panel = document.querySelector('.panel');
const toggleButton = document.getElementById('toggleButton');

let isPanelVisible = false;

// Initialize button direction
toggleButton.innerHTML = isPanelVisible ? '→' : '←';

function togglePanel() {
    isPanelVisible = !isPanelVisible;

    if (isPanelVisible) {
        panel.classList.add('visible');
        toggleButton.innerHTML = '→'; // Show right arrow when panel is visible
    } else {
        panel.classList.remove('visible');
        toggleButton.innerHTML = '←'; // Show left arrow when panel is hidden
    }

    // Send panel visibility to main process for window resizing
    ipcRenderer.send('toggle-panel', isPanelVisible);
}

// Event listener for button click
toggleButton.addEventListener('click', togglePanel);
