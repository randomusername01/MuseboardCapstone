const { shell } = require("electron");
const path = require("path");
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
const tutorialContent = document.getElementById("tutorial-content");

tutorialButton.addEventListener("click", (e) => {
  tutorialModal.style.display = "block";

  tutorialContent.scrollTo({top: 0, left: 0});
  e.stopPropagation();
});

closeTutorialBtn.addEventListener("click", (e) => {
  tutorialModal.style.display = "none";
  tutorialContent.scrollTo({ top: 0, left: 0 });

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

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.isContentEditable) return;

  if (e.key === "Escape") {
    linkModal.style.display = "none";
    tutorialModal.style.display = "none";
    drawingOptionsDropdown.style.display = "none";
    return;
  }

  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return;

  switch (e.key.toLowerCase()) {
    case "t":
      e.preventDefault();
      disableAllModes();
      addText();
      break;

    case "m":
      e.preventDefault();
      disableAllModes();
      addMedia();
      break;

    case "k":
      e.preventDefault();
      disableAllModes();
      linkInput.value = "";
      linkModal.style.display = "block";
      linkBeingEdited = null;
      break;

    case "z":
      e.preventDefault();
      disableAllModes();
      undoBtn.click();
      break;

    case "d":
      e.preventDefault();
      disableAllModes();
      toggleDraw();
      break;

    case "e":
      e.preventDefault();
      disableAllModes();
      toggleClear();
      break;
  }
});

document.addEventListener("click", (event) => {
  if (event.target === linkModal) {
    linkModal.style.display = "none";
  }
});

const linkUrlInput = document.getElementById("link-input");
const linkTextInput = document.getElementById("link-text-input");

workspace.addEventListener("dragover", e => e.preventDefault());

workspace.addEventListener("drop", e => {
  e.preventDefault();
  const dropX = e.offsetX;
  const dropY = e.offsetY;

  for (const file of e.dataTransfer.files) {
    const ext  = file.path ? path.extname(file.path).toLowerCase()
                           : (file.name ? path.extname(file.name).toLowerCase() : "");
    const mime = file.type || "";

    const isGif  = mime === "image/gif"        || ext === ".gif";
    const isImg  = mime.startsWith("image/")   && !isGif;
    if (!isImg && !isGif) continue;

    if (file.path) {
      const element = isGif
        ? createGifElement(file.path,  `${dropY}px`, `${dropX}px`)
        : createImageElement(file.path, `${dropY}px`, `${dropX}px`);
      workspace.appendChild(element);
      undoStack.push({ type: "element", element });
      continue;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataURL = reader.result;
      const element = isGif
        ? createGifElement(dataURL,  `${dropY}px`, `${dropX}px`)
        : createImageElement(dataURL, `${dropY}px`, `${dropX}px`);
      workspace.appendChild(element);
      undoStack.push({ type: "element", element });
    };
    reader.readAsDataURL(file);
  }
});



insertLinkBtn.addEventListener("click", () => {
  const rawUrl = linkUrlInput.value.trim();
  const linkText = linkTextInput.value.trim() || rawUrl;

  if (!rawUrl) {
    linkModal.style.display = "none";
    return;
  }

  let finalUrl = rawUrl;
  if (!/^https?:\/\//i.test(finalUrl)) {
    finalUrl = "https://" + finalUrl;
  }

  if (linkBeingEdited) {
    linkBeingEdited.href      = finalUrl;
    linkBeingEdited.innerText = linkText;
    linkBeingEdited = null;
  } else {
    createLinkElement(finalUrl, linkText, "250px", "250px");
  }
  linkModal.style.display = "none";
  linkUrlInput.value = "";
  linkTextInput.value = "";
});



let undoStack = [];
let deleteEnabled = false;
let currentStroke = null;
let isDrawing = false;
let drawings = [];

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

  updatePanelWidth();
});

window.addEventListener("resize", resizeCanvas);

let drawingEnabled = false;

const colorPicker = document.getElementById("color-picker");
const lineWidth = document.getElementById("line-width");

colorPicker.addEventListener("input", e => {
  const c = e.target.value;
  toolActive[currentTool].color   = c;
  activeSettings.color            = c;
  console.log(`Set ${currentTool} color →`, c);
});

lineWidth.addEventListener("input", e => {
  const w = parseInt(e.target.value, 10) || toolDefaults[currentTool].lineWidth;
  toolActive[currentTool].lineWidth = w;
  activeSettings.lineWidth          = w;
  console.log(`Set ${currentTool} width →`, w);
});

function enableDrawing() {
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

function toggleDraw() {
  drawingEnabled = !drawingEnabled;

  if (drawingEnabled) {
    disableDeleteMode();
    canvas.style.pointerEvents = "auto";
    canvas.style.cursor = 'default';
    console.log("Drawing mode enabled.");
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
  } else {
    canvas.style.pointerEvents = "none";
    canvas.style.cursor = 'default';
    console.log("Drawing mode disabled.");
    canvas.removeEventListener("mousedown", startDrawing);
    canvas.removeEventListener("mousemove", draw);
    canvas.removeEventListener("mouseup", stopDrawing);
    canvas.style.pointerEvents = "none";
  }

  drawBtn.classList.toggle("active", drawingEnabled);
}

function toggleClear() {
  deleteEnabled = !deleteEnabled;

  if (deleteEnabled) {
    disableDrawing();
    canvas.style.cursor = 'crosshair';
    console.log("Clear mode on");
  } else {
    canvas.style.cursor = 'default';
    console.log("Clear mode off");
  }
  clearBtn.classList.toggle("active", deleteEnabled);
}


function getMousePosition(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

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
  textBox.style.color = "#000000";

  canvas.appendChild(textBox);
  workspace.appendChild(textBox);
  undoStack.push({ type: "element", element: textBox });

  makeDraggable(textBox);

  textBox.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(textBox);
  selection.removeAllRanges();
  selection.addRange(range);
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
  img.draggable = false;
  img.addEventListener("dragstart", e => e.preventDefault());
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
  gif.draggable = false;
  gif.addEventListener("dragstart", e => e.preventDefault());
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

let currentLink   = null;
let linkToolbar   = null;
let hideTimer     = null;

function buildToolbar() {
  linkToolbar = document.createElement("div");
  linkToolbar.className = "link-toolbar";
  linkToolbar.innerHTML = `
    <button id="edit-link-btn">Edit</button>
    <button id="delete-link-btn">Delete</button>
  `;
  document.body.appendChild(linkToolbar);

  linkToolbar.querySelector("#edit-link-btn").addEventListener("click", () => {
    if (!currentLink) return;
    linkUrlInput.value  = currentLink.href;
    linkTextInput.value = currentLink.innerText;
    linkModal.style.display = "block";
    linkBeingEdited = currentLink;
    hideLinkToolbar(true);
  });

linkToolbar.querySelector("#delete-link-btn").addEventListener("click", () => {
  if (!currentLink) return;
  undoStack.push({
  type: "delete-element",
  element: currentLink,
  parent: currentLink.parentNode,
  nextSibling: currentLink.nextSibling
  });
  currentLink.remove();
  hideLinkToolbar(true);
});

  

  linkToolbar.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  linkToolbar.addEventListener("mouseleave", startHideCountdown);
}

function positionToolbar(linkEl) {
  const rect = linkEl.getBoundingClientRect();
  linkToolbar.style.left   = `${rect.left}px`;
  linkToolbar.style.top    = `${rect.bottom + 4}px`;
}

function showLinkToolbar(linkEl) {
  clearTimeout(hideTimer);
  currentLink = linkEl;
  if (!linkToolbar) buildToolbar();
  positionToolbar(linkEl);
  linkToolbar.style.display = "flex";
}

function hideLinkToolbar(force = false) {
  clearTimeout(hideTimer);
  if (linkToolbar) linkToolbar.style.display = "none";
  if (force) currentLink = null;
}

function startHideCountdown() {
  hideTimer = setTimeout(() => hideLinkToolbar(true), 300);
}

workspace.addEventListener("mouseover", e => {
  if (e.target.tagName === "A") showLinkToolbar(e.target);
});
workspace.addEventListener("mouseout", e => {
  if (e.target.tagName === "A" && !linkToolbar?.contains(e.relatedTarget)) {
    startHideCountdown();
  }
});


addLinkBtn.addEventListener("click", () => {
  linkInput.value = "";
  linkModal.style.display = "block";
  linkBeingEdited = null;
});

function createLinkElement(linkUrl, linkText, top = "250px", left = "250px") {
  if (!linkUrl.trim()) return;

  const link = document.createElement("a");
  link.href = linkUrl;
  link.innerText = linkText;
  link.target = "_blank";
  link.style.position = "absolute";
  link.style.top = top;
  link.style.left = left;
  link.style.color = "blue";
  link.style.textDecoration = "underline";
  link.style.cursor = "move";
  link.style.zIndex = "4";

  workspace.appendChild(link);
  undoStack.push({ type: "element", element: link });
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
  drawingEnabled = false;
  deleteEnabled  = false;
  document.querySelectorAll('.toolbar-btn').forEach(btn =>
    btn.classList.remove('active')
  );
  canvas.style.cursor = "default";
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
    const parent = workspace;
    const next = target.nextSibling;
    undoStack.push({
      type: "delete-element",
      element: target,
      parent,
      nextSibling: next
    });
    target.remove();
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
      const [removedStroke] = drawings.splice(removedIndex, 1);
      undoStack.push({ type: "delete-stroke", stroke: removedStroke, index: removedIndex });
      redrawCanvas();
    }    
  }
});
workspace.addEventListener("dragover", e => e.preventDefault());

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
  let isDown = false;
  let startX = 0, startY = 0;
  let elemX  = 0, elemY  = 0;
  let moved  = false;

  element.addEventListener("mousedown", e => {
    if (element.contentEditable === "true" && document.activeElement === element) return;
    if (e.button !== 0) return;

    if (element.tagName === "A") {
      e.preventDefault();
    }

    isDown  = true;
    startX  = e.pageX;
    startY  = e.pageY;
    elemX   = parseInt(element.style.left || 0, 10);
    elemY   = parseInt(element.style.top  || 0, 10);
    moved   = false;
  });

  document.addEventListener("mousemove", e => {
    if (!isDown) return;
    const dx = e.pageX - startX;
    const dy = e.pageY - startY;

    if (!moved && Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    if (moved) {
      element.style.left = `${elemX + dx}px`;
      element.style.top  = `${elemY + dy}px`;
    }
  });

  document.addEventListener("mouseup", e => {
    if (!isDown) return;
    isDown = false;

    if (element.tagName === "A") {
      e.preventDefault();

      if (!moved) {
        shell.openExternal(element.href);
      }
    }
  });

  if (element.tagName === "A") {
    element.addEventListener("click", e => e.preventDefault());
  }
}



drawBtn.addEventListener("click", () => {
  if (drawingOptionsDropdown.style.display === "block") return;
  if (drawingEnabled) {
    toggleDraw();
  } else {
    disableAllModes();
    toggleDraw();
  }
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
  disableAllModes();
  console.log("Text button clicked");
  addText();
});

addMediaBtn.addEventListener("click", () => {
  disableAllModes();
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
  if (deleteEnabled) {
    toggleClear();
  } else {
    disableAllModes();
    toggleClear();
  }
});

undoBtn.addEventListener("click", () => {
  const last = undoStack.pop();
  if (!last) return;

  switch (last.type) {
    case "drawing":
      const idx = drawings.indexOf(last.stroke);
      if (idx !== -1) drawings.splice(idx, 1);
      redrawCanvas();
      break;

    case "element":
      last.element.remove();
      break;

    case "delete-element":
      if (last.nextSibling) {
        last.parent.insertBefore(last.element, last.nextSibling);
      } else {
        last.parent.appendChild(last.element);
      }
      break;

    case "delete-stroke":
      drawings.splice(last.index, 0, last.stroke);
      redrawCanvas();
      break;

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

function updatePanelWidth() {
  const panel = document.querySelector('.panel');
  panel.style.width = `${window.innerWidth - 60}px`;
}

window.addEventListener('resize', updatePanelWidth);