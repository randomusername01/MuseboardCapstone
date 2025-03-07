// DOM Elements
const workspace = document.getElementById("workspace");
let canvas = document.getElementById("drawing-canvas");
let ctx = canvas.getContext("2d");

// Toolbar Buttons
const addTextBtn = document.getElementById("add-text-btn");
const addImageBtn = document.getElementById("add-image-btn");
const addGifBtn = document.getElementById("add-gif-btn");
const addLinkBtn = document.getElementById("add-link-btn");
const drawBtn = document.getElementById("draw-btn");
const clearBtn = document.getElementById("clear-btn");

// Modal Elements
const linkModal = document.getElementById("link-modal");
const linkInput = document.getElementById("link-input");
const insertLinkBtn = document.getElementById("insert-link-btn");

let isDrawing = false;

function resizeCanvas() {
  const toolbarHeight = document.querySelector(".toolbar").offsetHeight || 0;
  canvas.width = workspace.offsetWidth;
  canvas.height = workspace.offsetHeight - toolbarHeight;
  canvas.style.top = `${toolbarHeight}px`;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let drawingEnabled = false;

const colorPicker = document.getElementById("color-picker");
const lineWidth = document.getElementById("line-width");

function enableDrawing() {
  drawingEnabled = !drawingEnabled;
  drawBtn.classList.toggle("active", drawingEnabled);

  if (drawingEnabled) {
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.style.pointerEvents = "auto";
  } else {
    canvas.removeEventListener("mousedown", startDrawing);
    canvas.removeEventListener("mousemove", draw);
    canvas.removeEventListener("mouseup", stopDrawing);
    canvas.style.pointerEvents = "none";
  }
}

function getMousePosition(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function startDrawing(e) {
  const pos = getMousePosition(canvas, e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  isDrawing = true;
}

function draw(e) {
  if (!isDrawing) return;
  const pos = getMousePosition(canvas, e);
  ctx.lineTo(pos.x, pos.y);
  ctx.strokeStyle = colorPicker.value;
  ctx.lineWidth = lineWidth.value;
  ctx.stroke();
}

function stopDrawing() {
  isDrawing = false;
  ctx.closePath();
}

// Add Text to Workspace with optional parameters for innerText, top, and left
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
  workspace.appendChild(textBox);

  // Enable dragging
  makeDraggable(textBox);
}

// Add Image to Workspace
function addImage(filePath = null, top = "150px", left = "150px") {
  // If filePath is not provided, prompt the user to select a file
  if (!filePath) {
    ipcRenderer.invoke("select-file", "image").then((selectedFilePath) => {
      if (!selectedFilePath) return;

      // Create image element and set properties
      const img = document.createElement("img");
      img.src = selectedFilePath;
      img.style.position = "absolute";
      img.style.top = top;
      img.style.left = left;
      img.style.maxWidth = "200px";
      img.style.border = "1px solid #ddd";
      img.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
      img.style.cursor = "move";
      workspace.appendChild(img);

      // Enable dragging functionality
      makeDraggable(img);
    });
  } else {
    // Create image element with provided file path
    const img = document.createElement("img");
    img.src = filePath;
    img.style.position = "absolute";
    img.style.top = top;
    img.style.left = left;
    img.style.maxWidth = "200px";
    img.style.border = "1px solid #ddd";
    img.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
    img.style.cursor = "move";
    workspace.appendChild(img);

    // Enable dragging functionality
    makeDraggable(img);
  }
}

// Add GIF to Workspace
function addGif(src = null, top = "200px", left = "200px") {
  // If src is not provided, prompt the user to select a file
  if (!src) {
    ipcRenderer.invoke("select-file", "gif").then((selectedFilePath) => {
      if (!selectedFilePath) return;

      // Create GIF element and set properties
      const gif = document.createElement("img");
      gif.src = selectedFilePath;
      gif.style.position = "absolute";
      gif.style.top = top;
      gif.style.left = left;
      gif.style.maxWidth = "200px";
      gif.style.cursor = "move";
      workspace.appendChild(gif);

      // Enable dragging functionality
      makeDraggable(gif);
    });
  } else {
    // Create GIF element with provided src
    const gif = document.createElement("img");
    gif.src = src;
    gif.style.position = "absolute";
    gif.style.top = top;
    gif.style.left = left;
    gif.style.maxWidth = "200px";
    gif.style.cursor = "move";
    workspace.appendChild(gif);

    // Enable dragging functionality
    makeDraggable(gif);
  }
}

const { shell } = require("electron");

// Link logic ...
let linkBeingEdited = null;  // You might need this or have it declared above

addLinkBtn.addEventListener("click", () => {
  linkInput.value = "";
  linkModal.style.display = "block";
  linkBeingEdited = null;
});

// Handle insert link button ...
function createLinkElement(linkUrl, top, left) {
  // ...
}

// Clear Workspace
function clearContent() {
  // Clear the drawing canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Remove all added elements (text, images, links)
  workspace.innerHTML = "";
}

// Make Element Draggable
function makeDraggable(element) {
  let isDragging = false;
  let startX, startY, elementX, elementY;

  element.addEventListener("mousedown", (e) => {
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

drawBtn.addEventListener("click", enableDrawing);
addTextBtn.addEventListener("click", () => {
  addText();
});
addImageBtn.addEventListener("click", () => {
  addImage();
});
addGifBtn.addEventListener("click", () => {
  addGif();
});
clearBtn.addEventListener("click", clearContent);

function reinitCanvas() {
  // Grab the new canvas by ID again
  canvas = document.getElementById("drawing-canvas");
  ctx = canvas.getContext("2d");

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
