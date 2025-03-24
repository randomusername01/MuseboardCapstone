const { ipcRenderer } = require("electron");

const boardsContainer = document.getElementById("boardsContainer");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

let allBoards = [];

async function customPrompt(heading, defaultValue = "") {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay";
    document.body.appendChild(overlay);

    const dialog = document.createElement("div");
    dialog.className = "custom-modal-dialog";
    overlay.appendChild(dialog);

    const headingEl = document.createElement("div");
    headingEl.className = "dialog-header";
    headingEl.innerText = heading;
    dialog.appendChild(headingEl);

    const input = document.createElement("input");
    input.type = "text";
    input.value = defaultValue;
    input.className = "dialog-input";
    dialog.appendChild(input);

    const buttonRow = document.createElement("div");
    buttonRow.className = "dialog-buttons";
    dialog.appendChild(buttonRow);

    const okBtn = document.createElement("button");
    okBtn.innerText = "OK";
    okBtn.className = "dialog-ok-btn";
    buttonRow.appendChild(okBtn);

    const cancelBtn = document.createElement("button");
    cancelBtn.innerText = "Cancel";
    cancelBtn.className = "dialog-cancel-btn";
    buttonRow.appendChild(cancelBtn);

    okBtn.addEventListener("click", () => {
      const val = input.value.trim();
      document.body.removeChild(overlay);
      resolve(val || null);
    });

    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(overlay);
      resolve(null);
    });

    input.focus();
  });
}


window.addEventListener("DOMContentLoaded", async () => {
  const boards = await ipcRenderer.invoke("get-all-boards-metadata");
  if (!boards) return;
  allBoards = boards;
  renderBoards(allBoards);
});

function renderBoards(boards) {
    boardsContainer.innerHTML = "";
    boards.forEach((board) => {
      const item = document.createElement("div");
      item.className = "board-item";
  
      const thumbnail = document.createElement("img");
      thumbnail.src = board.thumbnailBase64 || "";
      item.appendChild(thumbnail);
  
      const titleEl = document.createElement("div");
      titleEl.className = "title";
      titleEl.innerText = board.title || "Untitled";
      item.appendChild(titleEl);
  
      const tagsEl = document.createElement("div");
      tagsEl.className = "tags";
      tagsEl.innerText = board.tags ? board.tags.join(", ") : "";
      item.appendChild(tagsEl);
  
      const editBtn = document.createElement("div");
      editBtn.className = "edit-btn";
      editBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.69,2.92,20.07,8.3a1,1,0,0,1,0,1.41l-9.9,9.9a1,1,0,0,1-.32.22L5.38,21.82a1,1,0,0,1-1.28-1.28l1.39-4.47a1,1,0,0,1,.22-.32l9.9-9.9A1,1,0,0,1,14.69,2.92ZM6.47,17.53l2,2,6.34-6.34-2-2Z"/>
        </svg>
      `;
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        editBoard(board);
      });
      item.appendChild(editBtn);
  
      item.addEventListener("click", () => {
        ipcRenderer.send("open-specific-board", board.filePath);
      });
  
      boardsContainer.appendChild(item);
    });
  }
  

function doSearch() {
  const query = searchInput.value.toLowerCase();
  if (!query) {
    renderBoards(allBoards);
    return;
  }

  const filtered = allBoards.filter((board) => {
    if (board.tags) {
      for (const tag of board.tags) {
        if (tag.toLowerCase().includes(query)) {
          return true;
        }
      }
    }
    if ((board.title || "").toLowerCase().includes(query)) {
      return true;
    }
    return false;
  });

  renderBoards(filtered);
}

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    doSearch();
  }
});
searchBtn.addEventListener("click", doSearch);

async function editBoard(board) {
  const newTitle = await customPrompt("Edit Title", board.title || "");
  if (newTitle === null) return;

  const existingTags = board.tags ? board.tags.join(", ") : "";
  const newTagsString = await customPrompt("Edit Tags", existingTags);
  if (newTagsString === null) return;
  const newTags = newTagsString.split(",").map(t => t.trim());

  board.title = newTitle;
  board.tags = newTags;
  renderBoards(allBoards);

  ipcRenderer.invoke("edit-board-metadata", {
    filePath: board.filePath,
    title: newTitle,
    tags: newTags
  });
}

