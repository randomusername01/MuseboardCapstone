const { ipcRenderer } = require("electron");

function convertImageToBase64(imagePath) {
  return new Promise((resolve, reject) => {
    // Check if the image is a GIF
    if (imagePath.toLowerCase().endsWith('.gif')) {
      fetch(imagePath)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
        .catch(reject);
    } else {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
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
  const images = document.querySelectorAll("#workspace img");

  for (const img of images) {
    const src = img.src;
    if (src.startsWith("file://")) {
      const base64Src = await convertImageToBase64(src);
      img.src = base64Src;
    }
  }

  const canvas = document.querySelector("canvas");
  let canvasState = null;

  if (canvas) {
    const drawingData = canvas.toDataURL("image/png");

    const canvasAttributes = {};
    for (const attr of canvas.attributes) {
      canvasAttributes[attr.name] = attr.value;
    }

    const thumbnailBase64 = generateThumbnail(canvas);

    canvasState = {
      drawingData,
      canvasAttributes,
      thumbnailBase64,
    };
  }

  const workspaceHTML = workspace.outerHTML;

  const workspaceMetadata = {
    width: workspace.offsetWidth,
    height: workspace.offsetHeight,
    top: workspace.style.top || "0px",
    left: workspace.style.left || "0px",
  };

  return {
    html: workspaceHTML,
    metadata: workspaceMetadata,
    canvasState: canvasState,
  };
}

function generateThumbnail(canvas) {
  const THUMB_WIDTH = 200;

  if (canvas.width === 0 || canvas.height === 0) return null;

  const thumbCanvas = document.createElement("canvas");
  const scale = THUMB_WIDTH / canvas.width;
  thumbCanvas.width = THUMB_WIDTH;
  thumbCanvas.height = canvas.height * scale;

  const tctx = thumbCanvas.getContext("2d");
  tctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);

  return thumbCanvas.toDataURL("image/png");
}

const saveBoard = async (boardData) => {
  const result = await ipcRenderer.invoke("save-board", boardData);
  if (result.success) {
    alert(`Board saved to ${result.filePath}`);
  } else {
    alert(`Failed to save board: ${result.error}`);
  }
};

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

  clearContent();

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = boardData.html;

  const newWorkspace = tempDiv.firstChild;

  if (newWorkspace) {
    const elements = newWorkspace.children;
    Array.from(elements).forEach((element) => {
      console.log(element);

      if (element.tagName.toLowerCase() === 'div' && element.getAttribute('data-type') === 'text') {
        addText(element.innerText, element.style.top, element.style.left);
      }
      else if (element.tagName.toLowerCase() === 'img' && /^data:image\/png;base64,/.test(element.getAttribute('src'))) {
        addImage(element.getAttribute('src'), element.style.top, element.style.left);
      }
      else if (element.tagName.toLowerCase() === 'img' && /^data:image\/gif;base64,/.test(element.getAttribute('src'))) {
        addGif(element.getAttribute('src'), element.style.top, element.style.left);
      }
      else if (element.tagName.toLowerCase() === 'div' && element.getAttribute('data-type') === 'link') {
        const anchor = element.querySelector('a');
        createLinkElement(anchor.href, element.style.top, element.style.left);
      }
    });

    const storedCanvas = boardData.canvasState;
    console.log(storedCanvas.canvasAttributes);

    if (storedCanvas) {
      const contentArea = document.querySelector('#content-area');
      if (contentArea) {
        const existingCanvas = contentArea.querySelector('canvas');

        const newCanvas = document.createElement('canvas');
        for (const [name, value] of Object.entries(storedCanvas.canvasAttributes)) {
          newCanvas.setAttribute(name, value);
        }

        newCanvas.id = "drawing-canvas";

        const ctx = newCanvas.getContext('2d');
        const img = new Image();
        img.src = boardData.canvasState.drawingData;
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };

        if (existingCanvas) {
          contentArea.replaceChild(newCanvas, existingCanvas);
        } else {
          contentArea.appendChild(newCanvas);
        }

        window.reinitCanvas();
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

async function loadSettings() {
  const settings = await ipcRenderer.invoke("get-settings");
  console.log("Loaded settings:", settings);
  return settings;
}

async function saveSetting(key, value) {
  await ipcRenderer.invoke("save-setting", key, value);

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

loadSettings().then((settings) => {
  if (settings) {
    toggleLaunchStart.checked = settings.launchOnStart || false;
    toggleDarkMode.checked = settings.darkMode || false;
  }
});

function togglePanel() {
  isPanelVisible = !isPanelVisible;

  panel.classList.toggle("visible", isPanelVisible);

  const icon = toggleButton.querySelector("i");
  icon.classList.replace(
    isPanelVisible ? "fa-square-caret-left" : "fa-square-caret-right",
    isPanelVisible ? "fa-square-caret-right" : "fa-square-caret-left"
  );

  ipcRenderer.send("toggle-panel", isPanelVisible);

}

toggleButton.addEventListener("click", togglePanel);

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

const openBtn = document.getElementById("openBtn");
const saveAsBtn = document.getElementById("saveAsBtn");

if (openBtn) {
  openBtn.addEventListener("click", () => {
    ipcRenderer.send("open-custom-browser");
    settingsDropdown.style.display = "none";
  });
}

const saveBtn = document.getElementById("saveBtn");
console.log("saveBtn is:", saveBtn);

if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    console.log("Save clicked");

    const userTitle = await customPrompt("Enter board title:") || "Untitled Board";
    console.log("User title is:", userTitle);

    const tagString = await customPrompt("Enter tags (comma-separated):");
    let tags = [];
    if (tagString) {
      tags = tagString.split(",").map(t => t.trim());
    }

    console.log("Tags array is:", tags);

    let workspaceData = await grabWorkspaceAndCanvas();
    workspaceData.title = userTitle;
    workspaceData.tags = tags;
    saveBoard(workspaceData);
  });
}




if (saveAsBtn) {
  saveAsBtn.addEventListener("click", () => {
    console.log("Save As clicked");
    settingsDropdown.style.display = "none";
  });
}

function customPrompt(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';
    document.body.appendChild(overlay);

    const dialog = document.createElement('div');
    dialog.style.backgroundColor = '#fff';
    dialog.style.padding = '20px';
    dialog.style.borderRadius = '5px';
    dialog.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    dialog.style.minWidth = '300px';
    overlay.appendChild(dialog);

    const label = document.createElement('label');
    label.innerText = message;
    label.style.display = 'block';
    label.style.marginBottom = '8px';
    dialog.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.style.width = '100%';
    input.style.marginBottom = '12px';
    dialog.appendChild(input);

    const buttonRow = document.createElement('div');
    buttonRow.style.textAlign = 'right';
    dialog.appendChild(buttonRow);

    const okBtn = document.createElement('button');
    okBtn.innerText = 'OK';
    okBtn.style.marginRight = '10px';
    buttonRow.appendChild(okBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.innerText = 'Cancel';
    buttonRow.appendChild(cancelBtn);

    okBtn.addEventListener('click', () => {
      const value = input.value.trim();
      document.body.removeChild(overlay); 
      resolve(value || null);
    });

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(null);
    });

    input.focus();
  });
}
