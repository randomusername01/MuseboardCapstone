const { ipcRenderer } = require("electron");



function convertImageToBase64(imagePath) {
  return new Promise((resolve, reject) => {
    // Check if the image is a GIF
    if (imagePath.toLowerCase().endsWith('.gif')) {
      fetch(imagePath)
        .then(response => response.blob()) // Fetch the image as a Blob
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
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
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imagePath;
    }
  });
}


async function grabWorkspaceAndCanvas() {
  // Get all image elements in the workspace
  const images = document.querySelectorAll('#workspace img');

  // Replace image paths with base64 data
  for (const img of images) {
      const src = img.src;
      if (src.startsWith('file://')) {
          // Assuming it's a local file path, convert it to base64
          const base64Src = await convertImageToBase64(src);
           // Replace the image's source with the base64 string
          img.src = base64Src;
      }
  }

  // Get the canvas element in the workspace
  const canvas = document.querySelector('canvas');
  let canvasState = null;

  if (canvas) {
      // Capture the drawing data and attributes of the canvas
      const drawingData = canvas.toDataURL(); // Get base64 data for canvas drawing
      const canvasAttributes = {};
      for (const attr of canvas.attributes) {
        canvasAttributes[attr.name] = attr.value;
    }

      // Store the canvas data and attributes
      canvasState = {
          drawingData,
          canvasAttributes,
      };
  }

  // Serialize the entire workspace HTML
  const workspaceHTML = workspace.outerHTML;

  // Get workspace dimensions and position
  const workspaceMetadata = {
      width: workspace.offsetWidth,
      height: workspace.offsetHeight,
      top: workspace.style.top || '0px',
      left: workspace.style.left || '0px',
  };

  return {
      html: workspaceHTML,
      metadata: workspaceMetadata,
      canvasState: canvasState,
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

ipcRenderer.on('load-board-data', (e, boardData) => {
  if (!boardData || !boardData.html) {
    console.error("boardData or its 'html' attribute is undefined");
    return;
  }

  // Clear the current workspace
  clearContent();

  // Parse the saved workspace HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = boardData.html;

  const newWorkspace = tempDiv.firstChild;

  if (newWorkspace) {
    // Iterate through child elements of the workspace
    const elements = newWorkspace.children;
    Array.from(elements).forEach((element) => {
      console.log(element);

      // Adding text
      if (element.tagName.toLowerCase() === 'div' && element.getAttribute('data-type') === 'text') {
        addText(element.innerText, element.style.top, element.style.left);
      }
      // Adding image
      else if (element.tagName.toLowerCase() === 'img' && /^data:image\/png;base64,/.test(element.getAttribute('src'))) {
        addImage(element.getAttribute('src'), element.style.top, element.style.left);
      }
      // Adding gif
      else if (element.tagName.toLowerCase() === 'img' && /^data:image\/gif;base64,/.test(element.getAttribute('src'))) {
        addGif(element.getAttribute('src'), element.style.top, element.style.left);
      }
      // Adding link
      else if (element.tagName.toLowerCase() === 'div' && element.getAttribute('data-type') === 'link') {
        const anchor = element.querySelector('a');
        createLinkElement(anchor.href, element.style.top, element.style.left);
      }
    });

    // Handle the canvas outside the workspace
    const storedCanvas = boardData.canvasState;
    console.log(storedCanvas.canvasAttributes);

    if (storedCanvas) {
      // Locate the div.content-area and replace its canvas
      const contentArea = document.querySelector('#content-area');
      if (contentArea) {
        const existingCanvas = contentArea.querySelector('canvas');

        // Create a new canvas and copy attributes from the saved canvas
        const newCanvas = document.createElement('canvas');
        for (const [name, value] of Object.entries(storedCanvas.canvasAttributes)) {
          newCanvas.setAttribute(name, value);
        }

        // Restore the drawing data on the new canvas
        const ctx = newCanvas.getContext('2d');
        const img = new Image();
        console.log(storedCanvas.canvasState);
        img.src = boardData.canvasState.drawingData;
        console.log(img.src);
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };

        // Replace the existing canvas with the new canvas
        if (existingCanvas) {
          // Replace the existing canvas
          contentArea.replaceChild(newCanvas, existingCanvas);
        } else {
          // Append if no canvas exists
          contentArea.appendChild(newCanvas);
        }
      }
    } else {
      console.error("Parsed workspace is empty or invalid");
    }
  }
});


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

// Load settings from the main process
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
      const result = await ipcRenderer.invoke('open-board-file');
      if (result && result.success) {
        console.log("Board loaded successfully");
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
    let workspaceData = await grabWorkspaceAndCanvas();
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