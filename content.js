// DOM Elements
const workspace = document.getElementById("workspace");
const canvas = document.getElementById("drawing-canvas");
const ctx = canvas.getContext("2d");

// Toolbar Buttons
const addTextBtn = document.getElementById("add-text-btn");
const addImageBtn = document.getElementById("add-image-btn");
const addGifBtn = document.getElementById("add-gif-btn");
const addLinkBtn = document.getElementById("add-link-btn");
const drawBtn = document.getElementById("draw-btn");
const clearBtn = document.getElementById("clear-btn");

// Enable Drawing Mode
let isDrawing = false;
function enableDrawing() {
  isDrawing = true;
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
}

function startDrawing(e) {
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
}

function draw(e) {
  if (!isDrawing) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.strokeStyle = "#34495e";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function stopDrawing() {
  isDrawing = false;
  ctx.closePath();
}

// Add Text to Workspace
function addText() {
  const textBox = document.createElement("div");
  textBox.contentEditable = true;
  textBox.innerText = "Type your text here...";
  textBox.style.position = "absolute";
  textBox.style.top = "100px";
  textBox.style.left = "100px";
  textBox.style.color = "#2c3e50";
  textBox.style.fontSize = "1em";
  textBox.style.cursor = "move";
  workspace.appendChild(textBox);

  // Enable dragging
  makeDraggable(textBox);
}

// Add Image to Workspace
function addImage() {
  const imageUrl = prompt("Enter the image URL:");
  if (!imageUrl) return;
  const img = document.createElement("img");
  img.src = imageUrl;
  img.style.position = "absolute";
  img.style.top = "150px";
  img.style.left = "150px";
  img.style.maxWidth = "200px";
  img.style.cursor = "move";
  workspace.appendChild(img);

  // Enable dragging
  makeDraggable(img);
}

// Add GIF to Workspace
function addGif() {
  const gifUrl = prompt("Enter the GIF URL:");
  if (!gifUrl) return;
  const gif = document.createElement("img");
  gif.src = gifUrl;
  gif.style.position = "absolute";
  gif.style.top = "200px";
  gif.style.left = "200px";
  gif.style.maxWidth = "200px";
  gif.style.cursor = "move";
  workspace.appendChild(gif);

  // Enable dragging
  makeDraggable(gif);
}

// Add Link to Workspace
function addLink() {
  const linkUrl = prompt("Enter the link URL:");
  if (!linkUrl) return;
  const link = document.createElement("a");
  link.href = linkUrl;
  link.innerText = "Click Me";
  link.target = "_blank";
  link.style.position = "absolute";
  link.style.top = "250px";
  link.style.left = "250px";
  link.style.color = "#2980b9";
  link.style.fontSize = "1em";
  link.style.cursor = "move";
  workspace.appendChild(link);

  // Enable dragging
  makeDraggable(link);
}

// Clear Workspace
function clearContent() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  workspace.innerHTML = "";
}

// Make Element Draggable
function makeDraggable(element) {
  let isDragging = false;
  let offsetX, offsetY;

  element.addEventListener("mousedown", (e) => {
    isDragging = true;
    // Recording the initial mouse position and the current position of the element
    startX = e.pageX;
    startY = e.pageY;
    elementX = parseInt(element.style.left || 0, 10);
    elementY = parseInt(element.style.top || 0, 10);
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    // Calculating new position of element based on the difference from the starting mouse position
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
addTextBtn.addEventListener("click", addText);
addImageBtn.addEventListener("click", addImage);
addGifBtn.addEventListener("click", addGif);
addLinkBtn.addEventListener("click", addLink);
clearBtn.addEventListener("click", clearContent);
