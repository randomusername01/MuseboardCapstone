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

// Modal Elements
const linkModal = document.getElementById("link-modal");
const linkInput = document.getElementById("link-input");
const insertLinkBtn = document.getElementById("insert-link-btn");

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

// Add Text to Workspace
function addText() {
  const textBox = document.createElement("div");
  textBox.contentEditable = true;
  textBox.innerText = "Type your text here...";
  textBox.style.position = "absolute";
  textBox.style.top = "100px";
  textBox.style.left = "100px";
  textBox.style.fontSize = "1em";
  textBox.style.cursor = "move";
  workspace.appendChild(textBox);

  // Enable dragging
  makeDraggable(textBox);
}

// Add Image to Workspace
function addImage() {
  ipcRenderer.invoke("select-file", "image").then((filePath) => {
    if (!filePath) return;

    const img = document.createElement("img");
    img.src = filePath;
    img.style.position = "absolute";
    img.style.top = "150px";
    img.style.left = "150px";
    img.style.maxWidth = "200px";
    img.style.border = "1px solid #ddd";
    img.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
    img.style.cursor = "move";
    workspace.appendChild(img);

    // Enable dragging
    makeDraggable(img);
  });
}

// Add GIF to Workspace
function addGif() {
  ipcRenderer.invoke("select-file", "gif").then((filePath) => {
    if (!filePath) return;

    const gif = document.createElement("img");
    gif.src = filePath;
    gif.style.position = "absolute";
    gif.style.top = "200px";
    gif.style.left = "200px";
    gif.style.maxWidth = "200px";
    gif.style.border = "1px solid #ddd";
    gif.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
    gif.style.cursor = "move";
    workspace.appendChild(gif);

    // Enable dragging
    makeDraggable(gif);
  });
}

const { shell } = require("electron");

// Create link 
addLinkBtn.addEventListener("click", () => {
  linkInput.value = ""; 
  linkModal.style.display = "block";
  linkBeingEdited = null; 
});

// Handle insert button 
insertLinkBtn.addEventListener("click", () => {
  const linkUrl = linkInput.value.trim();

//validate url
  const validLinkUrl =
    linkUrl.startsWith("http://") || linkUrl.startsWith("https://")
      ? linkUrl
      : `https://${linkUrl}`;

  if (!validLinkUrl) {
    alert("Please enter a valid link.");
    return;
  }

  if (linkBeingEdited) {
    linkBeingEdited.href = validLinkUrl;
    linkBeingEdited.innerText = validLinkUrl;
    linkBeingEdited = null; 
  } else {
    createLinkElement(validLinkUrl, "250px", "250px");
  }

  linkModal.style.display = "none"; 
});

// Create link element
function createLinkElement(linkUrl, top, left) {
  const linkWrapper = document.createElement("div");
  linkWrapper.style.position = "absolute";
  linkWrapper.style.top = top;
  linkWrapper.style.left = left;
  linkWrapper.style.paddingRight = "10px"; 
  linkWrapper.style.display = "inline-block";

  const link = document.createElement("a");
  link.href = linkUrl;
  link.innerText = linkUrl;
  link.style.color = "#2980b9";
  link.style.fontSize = "1em";
  link.style.cursor = "pointer";
  link.target = "_blank";

  // Open link in default browser
  link.addEventListener("click", (e) => {
    e.preventDefault();
    shell.openExternal(link.href);
  });

  // Create edit button
  const editLinkBtn = document.createElement("button");
  editLinkBtn.className = "edit-link-btn";
  editLinkBtn.style.position = "absolute";
  editLinkBtn.style.right = "-15px"; 
  editLinkBtn.style.top = "50%";
  editLinkBtn.style.transform = "translateY(-50%)";
  editLinkBtn.style.width = "20px"; 
  editLinkBtn.style.height = "20px";
  editLinkBtn.style.background = "#bdc3c7"; 
  editLinkBtn.style.border = "none";
  editLinkBtn.style.borderRadius = "4px"; 
  editLinkBtn.style.cursor = "pointer";
  editLinkBtn.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
  editLinkBtn.style.justifyContent = "center";
  editLinkBtn.style.alignItems = "center";
  editLinkBtn.style.display = "none"; 
  editLinkBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14px" height="14px">
      <path d="M14.69,2.92,20.07,8.3a1,1,0,0,1,0,1.41l-9.9,9.9a1,1,0,0,1-.32.22L5.38,21.82a1,1,0,0,1-1.28-1.28l1.39-4.47a1,1,0,0,1,.22-.32l9.9-9.9A1,1,0,0,1,14.69,2.92ZM6.47,17.53l2,2,6.34-6.34-2-2Z"/>
    </svg>
  `;

  linkWrapper.addEventListener("mouseenter", () => {
    editLinkBtn.style.display = "flex";
  });

  linkWrapper.addEventListener("mouseleave", () => {
    editLinkBtn.style.display = "none";
  });

  // Handle edit button click
  editLinkBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    linkInput.value = link.href; 
    linkModal.style.display = "block"; 
    linkBeingEdited = link; 
  });

  
  linkWrapper.appendChild(link);
  linkWrapper.appendChild(editLinkBtn); 

  // Add link ot canvas
  workspace.appendChild(linkWrapper);

  // Enable dragging
  makeDraggable(linkWrapper);
}

// Clear Workspace
function clearContent() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  workspace.innerHTML = ""; // Removes all added elements
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
addTextBtn.addEventListener("click", addText);
addImageBtn.addEventListener("click", addImage);
addGifBtn.addEventListener("click", addGif);
clearBtn.addEventListener("click", clearContent);
