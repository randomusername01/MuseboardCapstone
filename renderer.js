const { ipcRenderer } = require("electron");

function convertImageToBase64(imagePath) {
  return new Promise((resolve, reject) => {
    // Check if the image is a GIF
    if (imagePath.toLowerCase().endsWith('.gif')) {
      fetch(imagePath)
        .then(response => response.blob()) // Fetch the image as a Blob
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result); // result contains the base64 encoded string
          reader.onerror = reject;
          reader.readAsDataURL(blob); // Read image Blob as base64 string
        })
        .catch(reject); // Handle fetch errors
    } else {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result); // result contains the base64 encoded string
      reader.onerror = reject;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png')); // Returns base64 string in PNG format
      };
      img.src = imagePath;
    }
  });
}


async function grabWorkspace() {
  // Get all image elements in the workspace
  const images = document.querySelectorAll('#workspace img');
  
  // Replace image paths with base64 data
  for (const img of images) {
    const src = img.src;
    if (src.startsWith('file://')) {
      // Assuming it's a local file path, convert it to base64
      const base64Src = await convertImageToBase64(src);
      img.src = base64Src; // Replace the image's source with the base64 string
    }
  }

  // Serialize the entire workspace
  const workSpaceHTML = workspace.outerHTML;

  // Get workspace dimensions and position
  const workspaceMetadata = {
    width: workspace.offsetWidth,
    height: workspace.offsetHeight,
    top: workspace.style.top || '0px',
    left: workspace.style.left || '0px'
  };

  return {
    html: workSpaceHTML,
    metadata: workspaceMetadata
  };
}


const saveBoard = async (boardData) => {
  const result = await ipcRenderer.invoke('save-board', boardData);
  if (result.success) {
    alert(`Board saved to ${result.filePath}`);
  } else {
    alert(`Failed to save board: ${result.error}`);
  }
}

function applySettings(settings) {
  if (settings.darkMode) {
    document.documentElement.classList.add("dark-mode");
  } else {
    document.documentElement.classList.remove("dark-mode");
  }

  ipcRenderer.send("toggle-launch-on-startup", settings.launchOnStart);
}

ipcRenderer.on("apply-settings", (e, settings) => {
  applySettings(settings);
});

ipcRenderer.on(
  "update-theme-colors",
  (e, newPrimaryColor, newSecondaryColor) => {
    document.documentElement.style.setProperty(
      "--primary-color",
      newPrimaryColor
    );
    document.documentElement.style.setProperty(
      "--secondary-color",
      newSecondaryColor
    );
  }
);

// Load settings from the main process (ensure you get the latest settings from the settings.json file)
async function loadSettings() {
  const settings = await ipcRenderer.invoke("get-settings");
  console.log("Loaded settings:", settings);
  return settings;
}

// Function to save a setting to the settings file
async function saveSetting(key, value) {
  // Calling the main process to save the setting
  await ipcRenderer.invoke("save-setting", key, value);

  // After saving, reload and apply the settings
  const settings = await ipcRenderer.invoke("get-settings");
  applySettings(settings);
}

const panel = document.querySelector(".panel");
const toggleButton = document.getElementById("toggleButton");
const settingsButton = document.getElementById("settingsButton");
const settingsDropdown = document.getElementById("settingsDropdown");
const toggleLaunchStart = document.getElementById("toggleLaunchStart");
const toggleDarkMode = document.getElementById("toggleDarkMode");
const toggleAutoSave = document.getElementById("toggleAutoSave");

let isPanelVisible = false;

toggleButton.innerHTML = isPanelVisible ? "→" : "←";

// Loading settings and initializing the UI
loadSettings().then((settings) => {
  // Initializing UI elements based on the saved settings
  if (settings) {
    toggleLaunchStart.checked = settings.launchOnStart || false;
    toggleDarkMode.checked = settings.darkMode || false;
    toggleAutoSave.checked = settings.autoSave || false;
  }
});

function togglePanel() {
  isPanelVisible = !isPanelVisible;

  if (isPanelVisible) {
    panel.classList.add("visible");
    toggleButton.innerHTML = "→";
  } else {
    panel.classList.remove("visible");
    toggleButton.innerHTML = "←";
  }

  ipcRenderer.send("toggle-panel", isPanelVisible);
}

toggleButton.addEventListener("click", togglePanel);

// Toggle settings dropdown
settingsButton.addEventListener("click", (e) => {
  e.stopPropagation();
  settingsDropdown.style.display =
    settingsDropdown.style.display === "block" ? "none" : "block";
});

settingsDropdown.addEventListener("click", (e) => {
  e.stopPropagation();
});

document.addEventListener("click", () => {
  settingsDropdown.style.display = "none";
});

// Theme Customizer Toggle
document
  .querySelector('[data-action="customize-theme"]')
  .addEventListener("click", () => {
    ipcRenderer.send("open-theme-customizer");
  });

toggleLaunchStart.addEventListener("change", (e) => {
  saveSetting("launchOnStart", e.target.checked);
});

window.addEventListener("load", () => {
  const primaryColor = localStorage.getItem("primaryColor");
  const secondaryColor = localStorage.getItem("secondaryColor");

  if (primaryColor && secondaryColor) {
    document.documentElement.style.setProperty("--primary-color", primaryColor);
    document.documentElement.style.setProperty(
      "--secondary-color",
      secondaryColor
    );
  }
});

toggleDarkMode.addEventListener("change", (e) => {
  saveSetting("darkMode", e.target.checked);
});

toggleAutoSave.addEventListener("change", (e) => {
  saveSetting("autoSave", e.target.checked);
});

const openBtn = document.getElementById("openBtn");
const saveBtn = document.getElementById("saveBtn");
const saveAsBtn = document.getElementById("saveAsBtn");

if (openBtn) {
  openBtn.addEventListener("click", async () => {
    try {
      // Trigger the main process to open a file dialog and select a .board file
      const result = await ipcRenderer.invoke('open-board-file');
      if (result && result.success) {
        const boardData = result.boardData; // The parsed board data from the .board file

        // Extract the workspace HTML and metadata
        const { html, metadata } = boardData;

        // Create a temporary div to parse the HTML and preserve the entire element structure
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Find the workspace element within the loaded HTML
        const newWorkspace = tempDiv.firstChild;

        // Replace the entire workspace element with the new one
        const workspace = document.querySelector('#workspace');
        workspace.replaceWith(newWorkspace); // Replace the entire workspace element with the new one

        alert('Board loaded successfully!');
      } else {
        alert('Failed to open the board file.');
      }
    } catch (error) {
      console.error('Error opening board:', error);
      alert('An error occurred while opening the board file.');
    }
    settingsDropdown.style.display = "none";
  });
}

if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    console.log("Save clicked");
    let workspaceData = await grabWorkspace();
    saveBoard(workspaceData);
    settingsDropdown.style.display = "none";
  });
}

if (saveAsBtn) {
  saveAsBtn.addEventListener("click", () => {
    console.log("Save As clicked");
    settingsDropdown.style.display = "none";
  });
}