const { ipcRenderer } = require('electron');

const panel = document.querySelector('.panel');
const toggleButton = document.getElementById('toggleButton');
const settingsButton = document.getElementById('settingsButton');
const settingsDropdown = document.getElementById('settingsDropdown');
const toggleLaunchStart = document.getElementById('toggleLaunchStart');
const toggleDarkMode = document.getElementById('toggleDarkMode');
const toggleAutoSave = document.getElementById('toggleAutoSave');

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

// Toggle settings dropdown
settingsButton.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsDropdown.style.display =
    settingsDropdown.style.display === 'block' ? 'none' : 'block';
});

settingsDropdown.addEventListener('click', (e) => {
  e.stopPropagation(); 
});

document.addEventListener('click', () => {
  settingsDropdown.style.display = 'none';
});

toggleLaunchStart.addEventListener('change', () => {
  console.log(`Launch on Start: ${toggleLaunchStart.checked}`);
});

toggleDarkMode.addEventListener('change', () => {
  console.log(`Dark Mode: ${toggleDarkMode.checked}`);
});

toggleAutoSave.addEventListener('change', () => {
  console.log(`Auto Save: ${toggleAutoSave.checked}`);
});

const saveBtn = document.getElementById('saveBtn');
const saveAsBtn = document.getElementById('saveAsBtn');

if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    console.log('Save clicked');
    settingsDropdown.style.display = 'none'; 
  });
}

if (saveAsBtn) {
  saveAsBtn.addEventListener('click', () => {
    console.log('Save As clicked');
    settingsDropdown.style.display = 'none'; 
  });
}