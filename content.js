const { shell } = require("electron");
const workspace = document.getElementById("workspace");
let canvas = document.getElementById("drawing-canvas");
let ctx = canvas.getContext("2d");

const addTextBtn = document.getElementById("add-text-btn");
const addMediaBtn = document.getElementById("add-media-btn");
const addLinkBtn = document.getElementById("add-link-btn");
const drawBtn = document.getElementById("draw-btn");
const clearBtn = document.getElementById("clear-btn");
const undoBtn = document.getElementById("undo-btn");

const linkModal = document.getElementById("link-modal");
const linkInput = document.getElementById("link-input");
const insertLinkBtn = document.getElementById("insert-link-btn");
const drawingOptionsDropdown = document.getElementById("drawing-options-dropdown");

const tutorialButton = document.getElementById("tutorialButton");
const tutorialModal = document.getElementById("tutorial-modal");
const closeTutorialBtn = document.getElementById("close-tutorial-btn");

tutorialButton.addEventListener("click", (e) => {
  tutorialModal.style.display = "block";
  e.stopPropagation();
});

closeTutorialBtn.addEventListener("click", (e) => {
  tutorialModal.style.display = "none";
  e.stopPropagation();
});

window.addEventListener("click", (e) => {
  if (e.target === tutorialModal) {
    tutorialModal.style.display = "none";
  }
});

drawingOptionsDropdown.addEventListener("click", (e) => {
  e.stopPropagation();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    linkModal.style.display = "none";
  }
});

document.addEventListener("click", (event) => {
  if (event.target === linkModal) {
    linkModal.style.display = "none";
  }
});

insertLinkBtn.addEventListener("click", () => {
  const linkUrl = linkInput.value.trim();
  if (linkUrl) {
    createLinkElement(linkUrl);
    linkModal.style.display = "none";
  }
});

let undoStack = [];
let deleteEnabled = false;
let currentStroke = null;
let isDrawing = false;

const toolDefaults = {
  pen: { lineWidth: 3, color: "#000000" },
  pencil: { lineWidth: 2, color: "#888888" },
  highlighter: { lineWidth: 8, color: "#ffff00" }, // thick & yellow
  brush: { lineWidth: 4, color: "#34495e" }
};
let toolActive = {
  pen: { ...toolDefaults.pen },
  pencil: { ...toolDefaults.pencil },
  highlighter: { ...toolDefaults.highlighter },
  brush: { ...toolDefaults.brush }
};
let activeSettings = { ...toolDefaults.pen, tool: "pen" };
let currentTool = "pen";
document.getElementById("drawing-tools").addEventListener("click", (e) => {
  if (e.target && e.target.classList.contains("tool-option")) {
    document.querySelectorAll("#drawing-tools .tool-option").forEach((btn) => {
      btn.classList.remove("selected");
    });
    e.target.classList.add("selected");
    currentTool = e.target.dataset.tool;
    document.getElementById("color-picker").value = toolActive[currentTool].color;
    document.getElementById("line-width").value = toolActive[currentTool].lineWidth;
    
    activeSettings = { ...toolActive[currentTool], tool: currentTool };
    
    console.log("Selected tool:", currentTool, "Active settings:", activeSettings);
  }
});

function resizeCanvas() {
  const rect = workspace.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  redrawCanvas();
}

window.addEventListener("load", () => {
  resizeCanvas();
  workspace.style.display = "block";
  if (!isPanelVisible) {
    togglePanel();
  }
});

window.addEventListener("resize", resizeCanvas);

let drawingEnabled = false;

const colorPicker = document.getElementById("color-picker");
const lineWidth = document.getElementById("line-width");

function enableDrawing() {
  disableDeleteMode();

  drawingEnabled = !drawingEnabled;
  drawBtn.classList.toggle("active", drawingEnabled);
  
  if (drawingEnabled) {
    console.log("Drawing mode enabled.");
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.style.pointerEvents = "auto";
  } else {
    console.log("Drawing mode disabled.");
    canvas.removeEventListener("mousedown", startDrawing);
    canvas.removeEventListener("mousemove", draw);
    canvas.removeEventListener("mouseup", stopDrawing);
    canvas.style.pointerEvents = "none";
  }
}

function getMousePosition(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

let drawings = [];

function startDrawing(e) {
  isDrawing = true;
  const pos = getMousePosition(canvas, e);
  console.log("Started drawing at:", pos);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);

  currentStroke = {
    path: [{ x: pos.x, y: pos.y }],
    color: activeSettings.color,
    width: activeSettings.lineWidth,
    tool: activeSettings.tool
  };

  drawings.push(currentStroke);
  canvas.addEventListener("mousemove", draw);
}

function draw(e) {
  if (!isDrawing || !currentStroke) return;
  const pos = getMousePosition(canvas, e);
  ctx.beginPath();
  const lastPoint = currentStroke.path[currentStroke.path.length - 1];
  ctx.moveTo(lastPoint.x, lastPoint.y);
  ctx.lineTo(pos.x, pos.y);
  
  ctx.strokeStyle = currentStroke.color;
  
  let effectiveLineWidth = currentStroke.width;
  let effectiveAlpha = 1;
  
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  
  if (currentStroke.tool === "pencil") {
    effectiveAlpha = 0.8;
  } else if (currentStroke.tool === "highlighter") {
    effectiveAlpha = 0.5;
    effectiveLineWidth = currentStroke.width + 3;
  } else if (currentStroke.tool === "brush") {
    effectiveAlpha = 1;
    effectiveLineWidth = currentStroke.width + 2;
    ctx.shadowColor = currentStroke.color;
    ctx.shadowBlur = 4;
  }
  
  ctx.globalAlpha = effectiveAlpha;
  ctx.lineWidth = effectiveLineWidth;
  ctx.lineCap = "round";
  ctx.stroke();
  
  currentStroke.path.push({ x: pos.x, y: pos.y });
}

function stopDrawing() {
  isDrawing = false;
  ctx.closePath();
  canvas.removeEventListener("mousemove", draw);
  if (currentStroke) {
    undoStack.push({type: "drawing", stroke: currentStroke});
    currentStroke = null;
  }
  redrawCanvas();
}

function addText(innerText = "Type your text here...", top = "100px", left = "100px") {
  const textBox = document.createElement("div");
  textBox.setAttribute("data-type", "text");
  textBox.contentEditable = true;
  textBox.innerText = innerText;
  textBox.style.position = "absolute";
  textBox.style.top = top;
  textBox.style.left = left;
  textBox.style.fontSize = "1em";
  textBox.style.cursor = "move";
  textBox.style.zIndex = 4;
  workspace.appendChild(textBox);
  textBox.focus();

  undoStack.push({type: "element", element: textBox});
  makeDraggable(textBox);
}


function addMedia(top = "150px", left = "150px") {
  ipcRenderer.invoke("select-file", "media").then((selectedFilePath) => {
    if (!selectedFilePath) return;
    const lowerPath = selectedFilePath.toLowerCase();
    let element;
    if (lowerPath.endsWith(".gif")) {
      element = createGifElement(selectedFilePath, top, left);
    } else {
      element = createImageElement(selectedFilePath, top, left);
    }
    workspace.appendChild(element);
    undoStack.push({type: "element", element: element});
  });
}

function createImageElement(src, top, left) {
  const img = document.createElement("img");
  img.src = src;
  img.style.position = "absolute";
  img.style.top = top;
  img.style.left = left;
  img.style.maxWidth = "200px";
  img.style.border = "1px solid #ddd";
  img.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
  img.style.cursor = "move";
  img.style.zIndex = "4";
  makeDraggable(img);
  return img;
}

function createGifElement(src, top, left) {
  const gif = document.createElement("img");
  gif.src = src;
  gif.style.position = "absolute";
  gif.style.top = top;
  gif.style.left = left;
  gif.style.maxWidth = "200px";
  gif.style.cursor = "move";
  gif.style.zIndex = "4";
  makeDraggable(gif);
  return gif;
}

let linkBeingEdited = null;

addLinkBtn.addEventListener("click", () => {
  linkInput.value = "";
  linkModal.style.display = "block";
  linkBeingEdited = null;
});

function createLinkElement(linkUrl, top = "250px", left = "250px") {
  if (!linkUrl.trim()) return;

  const link = document.createElement("a");
  link.href = linkUrl;
  link.innerText = linkUrl;
  link.target = "_blank";
  link.style.position = "absolute";
  link.style.top = top;
  link.style.left = left;
  link.style.color = "blue";
  link.style.textDecoration = "underline";
  link.style.cursor = "move";
  link.style.zIndex = "4";

  workspace.appendChild(link);
  undoStack.push({type: "element", element: link});
  makeDraggable(link);
}

function disableDeleteMode() {
  if (!deleteEnabled) return;

  deleteEnabled = false;
  clearBtn.classList.remove("active");
  workspace.style.cursor = "default";
  console.log("Delete mode disabled.");
}

function disableAllModes() {
  disableDrawing();
  disableDeleteMode();
}

function isPointNearLine(point, p1, p2, lineWidth) {
  const A = point.x - p1.x;
  const B = point.y - p1.y;
  const C = p2.x - p1.x;
  const D = p2.y - p1.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  const param = lenSq !== 0 ? dot / lenSq : -1;

  let nearestX, nearestY;
  if (param < 0) {
    nearestX = p1.x;
    nearestY = p1.y;
  } else if (param > 1) {
    nearestX = p2.x;
    nearestY = p2.y;
  } else {
    nearestX = p1.x + param * C;
    nearestY = p1.y + param * D;
  }

  const dx = point.x - nearestX;
  const dy = point.y - nearestY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= Math.max(10, lineWidth * 2);
}

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawings.forEach((stroke) => {
    ctx.save();
    if (stroke.tool !== "brush") {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      let effectiveAlpha = 1;
      if (stroke.tool === "pencil") {
        effectiveAlpha = 0.8;
      } else if (stroke.tool === "highlighter") {
        effectiveAlpha = 0.5;
        ctx.lineWidth = stroke.width + 3;
      }
      ctx.globalAlpha = effectiveAlpha;
      ctx.lineCap = "round";
      stroke.path.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
      ctx.closePath();
    } else {
      ctx.shadowColor = stroke.color;
      ctx.shadowBlur = 6;
      
      for (let offsetX = -1; offsetX <= 1; offsetX++) {
        for (let offsetY = -1; offsetY <= 1; offsetY++) {
          ctx.save();
          ctx.translate(offsetX, offsetY);
          ctx.beginPath();
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.width + 2;
          ctx.globalAlpha = 1;
          ctx.lineCap = "round";
          stroke.path.forEach((point, i) => {
            if (i === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
          ctx.closePath();
          ctx.restore();
        }
      }
    }
    ctx.restore();
  });
}

workspace.addEventListener("click", (event) => {
  if (!deleteEnabled) return;
  console.log("Delete mode active. Processing click...");

  const target = event.target;
  
  if (target.tagName === "A") {
    event.preventDefault();
  }
  
  if (target.tagName === "IMG" || target.tagName === "A" || target.dataset.type === "text") {
    console.log("Deleted element:", target);
    target.remove();
    undoStack = undoStack.filter(action => action.element !== target);
    return;
  }
  
  const canvasRect = canvas.getBoundingClientRect();
  if (
    event.clientX >= canvasRect.left &&
    event.clientX <= canvasRect.right &&
    event.clientY >= canvasRect.top &&
    event.clientY <= canvasRect.bottom
  ) {
    console.log("Canvas area clicked. Checking for stroke deletion...");
    const pos = {
      x: event.clientX - canvasRect.left,
      y: event.clientY - canvasRect.top,
    };
    let removedIndex = -1;
    for (let i = 0; i < drawings.length; i++) {
      const stroke = drawings[i];
      for (let j = 1; j < stroke.path.length; j++) {
        const p1 = stroke.path[j - 1];
        const p2 = stroke.path[j];
        if (isPointNearLine(pos, p1, p2, stroke.width)) {
          removedIndex = i;
          console.log(`Detected stroke ${i} for deletion.`);
          break;
        }
      }
      if (removedIndex !== -1) break;
    }
    if (removedIndex !== -1) {
      console.log(`Deleted stroke at index: ${removedIndex}`);
      drawings.splice(removedIndex, 1);
      redrawCanvas();
    } else {
      console.log("No stroke found at clicked position.");
    }
  }
});

function disableDrawing() {
  if (drawingEnabled) {
    drawingEnabled = false;
    drawBtn.classList.remove("active");
    canvas.style.pointerEvents = "none";
    canvas.removeEventListener("mousedown", startDrawing);
    canvas.removeEventListener("mousemove", draw);
    canvas.removeEventListener("mouseup", stopDrawing);
  }
}

function clearContent() {
  deleteEnabled = !deleteEnabled;
  clearBtn.classList.toggle("active", deleteEnabled);
  workspace.style.cursor = deleteEnabled ? "crosshair" : "default";
  console.log(`Erase mode ${deleteEnabled ? "ENABLED" : "DISABLED"}`);
  if (deleteEnabled) {
    canvas.style.pointerEvents = "none";
  } else {
    canvas.style.pointerEvents = "none";
  }
}

function makeDraggable(element) {
  let isDragging = false;
  let startX, startY, elementX, elementY;
  element.addEventListener("mousedown", (e) => {
    if (element.contentEditable === "true" && document.activeElement === element) {
      return;
    }
    isDragging = true;
    startX = e.pageX;
    startY = e.pageY;
    elementX = parseInt(element.style.left || 0, 10);
    elementY = parseInt(element.style.top || 0, 10);
  });
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const deltaX = e.pageX - startX;
    const deltaY = e.pageY - startY;
    element.style.left = `${elementX + deltaX}px`;
    element.style.top = `${elementY + deltaY}px`;
  });
  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

drawBtn.addEventListener("click", () => {
  if (drawingOptionsDropdown.style.display === "block") return;
  disableAllModes();
  enableDrawing();
});

drawBtn.addEventListener("dblclick", (e) => {
  if (drawingOptionsDropdown.style.display === "none" || drawingOptionsDropdown.style.display === "") {
    drawingOptionsDropdown.style.display = "block";
    
    document.getElementById("color-picker").value = toolActive[currentTool].color;
    document.getElementById("line-width").value = toolActive[currentTool].lineWidth;
    
    document.querySelectorAll("#drawing-tools .tool-option").forEach((btn) => {
      btn.classList.remove("selected");
      if (btn.dataset.tool === currentTool) {
        btn.classList.add("selected");
      }
    });
  } else {
    drawingOptionsDropdown.style.display = "none";
  }
  e.stopPropagation();
});

// const applyThemeBtn = document.getElementById("apply-theme-btn");

// applyThemeBtn.addEventListener("click", (e) => {
//   toolActive[currentTool] = {
//     color: document.getElementById("color-picker").value,
//     lineWidth: parseInt(document.getElementById("line-width").value, 10) || toolDefaults[currentTool].lineWidth
//   };
  
//   activeSettings = { ...toolActive[currentTool], tool: currentTool };
  
//   console.log("Theme applied for", currentTool, ":", activeSettings);
//   drawingOptionsDropdown.style.display = "none";
//   e.stopPropagation();
// });

const resetToolsBtn = document.getElementById("reset-tools-btn");

resetToolsBtn.addEventListener("click", (e) => {
  toolActive = {
    pen: { ...toolDefaults.pen },
    pencil: { ...toolDefaults.pencil },
    highlighter: { ...toolDefaults.highlighter },
    brush: { ...toolDefaults.brush }
  };
  document.getElementById("color-picker").value = toolActive[currentTool].color;
  document.getElementById("line-width").value = toolActive[currentTool].lineWidth;
  
  activeSettings = { ...toolActive[currentTool], tool: currentTool };
  
  console.log("Tools reset to defaults.");
  e.stopPropagation();
});

addTextBtn.addEventListener("click", () => {
  console.log("Text button clicked");
  addText();
});

addMediaBtn.addEventListener("click", () => {
  console.log("Media button clicked");
  addMedia();
});

addLinkBtn.addEventListener("click", () => {
  disableAllModes();
  linkInput.value = "";
  linkModal.style.display = "block";
  linkBeingEdited = null;
});
clearBtn.addEventListener("click", () => {
  disableDrawing();
  clearContent();
  console.log("Delete mode:", deleteEnabled);
});
undoBtn.addEventListener("click", () => {
  const lastAction = undoStack.pop();
  if (lastAction) {
    if (lastAction.type === "drawing") {
      const index = drawings.indexOf(lastAction.stroke);
      if (index !== -1) {
        drawings.splice(index, 1);
      }
      redrawCanvas();
    } else if (lastAction.type === "element") {
      lastAction.element.remove();
    }
  }
});
const closeDrawingOptions = document.getElementById("close-drawing-options");
closeDrawingOptions.addEventListener("click", (e) => {
  drawingOptionsDropdown.style.display = "none";
  e.stopPropagation();
});

function reinitCanvas() {
  canvas = document.getElementById("drawing-canvas");
  ctx = canvas.getContext("2d");
  redrawCanvas();
  if (drawingEnabled) {
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.style.pointerEvents = "auto";
  } else {
    canvas.style.pointerEvents = "none";
  }
}

window.reinitCanvas = reinitCanvas;