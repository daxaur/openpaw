import type { DashboardTheme } from "../types.js";

interface ThemeColors {
	bg: string;
	surface: string;
	surfaceHover: string;
	border: string;
	text: string;
	textDim: string;
	accent: string;
	accentDim: string;
	done: string;
	high: string;
	low: string;
}

const THEME_COLORS: Record<DashboardTheme, ThemeColors> = {
	paw: {
		bg: "#1a1008",
		surface: "#241a10",
		surfaceHover: "#2e2218",
		border: "#3a2a18",
		text: "#e8d8c8",
		textDim: "#8a7a6a",
		accent: "#b4783c",
		accentDim: "#8a5a2a",
		done: "#6a9a5a",
		high: "#d44",
		low: "#666",
	},
	midnight: {
		bg: "#0a0a0f",
		surface: "#12121a",
		surfaceHover: "#1a1a25",
		border: "#222233",
		text: "#d0d0e0",
		textDim: "#6a6a8a",
		accent: "#6688cc",
		accentDim: "#445588",
		done: "#5a8a5a",
		high: "#cc5555",
		low: "#555566",
	},
	neon: {
		bg: "#050505",
		surface: "#0a0a0a",
		surfaceHover: "#111111",
		border: "#1a1a1a",
		text: "#e0e0e0",
		textDim: "#555",
		accent: "#00ff88",
		accentDim: "#008844",
		done: "#00cc66",
		high: "#ff3355",
		low: "#444",
	},
	rose: {
		bg: "#120a0e",
		surface: "#1a1014",
		surfaceHover: "#24181e",
		border: "#3a2030",
		text: "#e8d0dc",
		textDim: "#8a6a7a",
		accent: "#d4688a",
		accentDim: "#a04868",
		done: "#6a9a7a",
		high: "#e05555",
		low: "#666",
	},
};

export function generateDashboardHTML(
	theme: DashboardTheme,
	botName: string,
): string {
	const t = THEME_COLORS[theme];

	// Escape botName for safe use in HTML/JS
	const safeBotName = botName.replace(/[&<>"']/g, "");

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeBotName} — Task Dashboard</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐾</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
--bg:${t.bg};--surface:${t.surface};--surface-hover:${t.surfaceHover};
--border:${t.border};--text:${t.text};--text-dim:${t.textDim};
--accent:${t.accent};--accent-dim:${t.accentDim};--done:${t.done};
--high:${t.high};--low:${t.low};
}
body{font-family:'JetBrains Mono',monospace;background:var(--bg);color:var(--text);min-height:100vh;font-size:13px}
header{display:flex;align-items:center;justify-content:space-between;padding:20px 28px;border-bottom:1px solid var(--border)}
.header-left{display:flex;align-items:center;gap:14px}
.logo{display:flex;align-items:center;gap:10px;font-size:18px;font-weight:700;color:var(--accent)}
.task-count{font-size:11px;color:var(--text-dim);background:var(--surface);padding:3px 10px;border-radius:10px;border:1px solid var(--border)}
.header-right{display:flex;align-items:center;gap:14px}
.search-wrap{position:relative;display:flex;align-items:center}
.search-wrap input{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:6px 10px 6px 28px;color:var(--text);font-family:inherit;font-size:11px;width:0;opacity:0;transition:all .25s;outline:none}
.search-wrap input.open{width:180px;opacity:1;padding:6px 10px 6px 28px}
.search-wrap input:focus{border-color:var(--accent)}
.search-icon{position:absolute;left:8px;color:var(--text-dim);font-size:12px;cursor:pointer;z-index:1}
.search-kbd{font-size:9px;color:var(--text-dim);border:1px solid var(--border);padding:1px 5px;border-radius:3px;margin-left:4px}
.settings-btn{background:none;border:1px solid var(--border);border-radius:8px;padding:6px 10px;color:var(--text-dim);cursor:pointer;font-family:inherit;font-size:12px;transition:all .15s}
.settings-btn:hover{border-color:var(--accent);color:var(--accent)}
.theme-switcher{display:flex;gap:8px}
.theme-dot{width:14px;height:14px;border-radius:50%;cursor:pointer;border:2px solid var(--border);transition:border-color .2s}
.theme-dot:hover,.theme-dot.active{border-color:var(--text)}
.theme-dot[data-theme="paw"]{background:#b4783c}
.theme-dot[data-theme="midnight"]{background:#6688cc}
.theme-dot[data-theme="neon"]{background:#00ff88}
.theme-dot[data-theme="rose"]{background:#d4688a}
.settings-panel{display:none;position:fixed;top:0;right:0;bottom:0;width:280px;background:var(--surface);border-left:1px solid var(--border);padding:24px;z-index:200;flex-direction:column;gap:20px}
.settings-panel.open{display:flex}
.settings-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:199}
.settings-overlay.open{display:block}
.settings-title{font-size:14px;font-weight:600;color:var(--accent);display:flex;justify-content:space-between;align-items:center}
.settings-close{background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:16px;font-family:inherit}
.settings-close:hover{color:var(--text)}
.settings-label{font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
.settings-input{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;outline:none;width:100%}
.settings-input:focus{border-color:var(--accent)}
.settings-themes{display:flex;gap:10px;flex-wrap:wrap}
.settings-theme{flex:1;min-width:50px;padding:8px;border:2px solid var(--border);border-radius:8px;cursor:pointer;text-align:center;font-size:10px;color:var(--text-dim);transition:all .15s}
.settings-theme:hover{border-color:var(--text-dim)}
.settings-theme.active{border-color:var(--accent);color:var(--accent)}
.board{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:24px 28px;min-height:calc(100vh - 80px)}
.column{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;display:flex;flex-direction:column;min-height:300px}
.column.drag-over{border-color:var(--accent);background:var(--surface-hover)}
.col-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border)}
.col-title{font-weight:600;font-size:14px;text-transform:uppercase;letter-spacing:1px}
.col-count{font-size:11px;color:var(--text-dim);background:var(--bg);padding:2px 8px;border-radius:10px}
.col-todo .col-title{color:var(--accent)}
.col-progress .col-title{color:var(--text)}
.col-done .col-title{color:var(--done)}
.cards{flex:1;display:flex;flex-direction:column;gap:8px;min-height:50px}
.card{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;cursor:grab;transition:all .15s;position:relative;animation:cardIn .25s ease-out}
.card:hover{border-color:var(--accent);transform:translateY(-1px)}
.card.dragging{opacity:.4;transform:scale(.95)}
.card-title{font-size:13px;font-weight:500;margin-bottom:4px;outline:none}
.card-title:focus{border-bottom:1px solid var(--accent)}
.card-desc{font-size:11px;color:var(--text-dim);margin-bottom:6px;outline:none}
.card-desc:focus{border-bottom:1px solid var(--accent)}
.card-footer{display:flex;align-items:center;justify-content:space-between}
.card-meta{display:flex;align-items:center;gap:8px}
.priority{display:flex;gap:4px}
.priority-dot{width:8px;height:8px;border-radius:50%;cursor:pointer;transition:transform .1s}
.priority-dot:hover{transform:scale(1.4)}
.priority-dot.high{background:var(--high)}
.priority-dot.normal{background:var(--accent)}
.priority-dot.low{background:var(--low)}
.priority-dot.active{box-shadow:0 0 0 2px var(--bg),0 0 0 4px currentColor}
.card-time{font-size:9px;color:var(--text-dim);opacity:.6}
.card-delete{font-size:11px;color:var(--text-dim);cursor:pointer;opacity:0;transition:opacity .15s}
.card:hover .card-delete{opacity:1}
.card-delete:hover{color:var(--high)}
.add-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;margin-top:8px;border:1px dashed var(--border);border-radius:8px;color:var(--text-dim);cursor:pointer;font-family:inherit;font-size:12px;background:none;transition:all .15s;width:100%}
.add-btn:hover{border-color:var(--accent);color:var(--accent)}
.empty{text-align:center;padding:40px 16px;color:var(--text-dim);font-size:12px;line-height:1.8}
.add-form{display:none;flex-direction:column;gap:8px;margin-top:8px}
.add-form.show{display:flex}
.add-form input,.add-form textarea{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;outline:none;resize:none}
.add-form input:focus,.add-form textarea:focus{border-color:var(--accent)}
.form-actions{display:flex;gap:6px}
.form-actions button{flex:1;padding:6px;border:1px solid var(--border);border-radius:6px;font-family:inherit;font-size:11px;cursor:pointer;background:var(--surface);color:var(--text);transition:all .15s}
.form-actions .save{background:var(--accent);color:var(--bg);border-color:var(--accent);font-weight:600}
.form-actions .save:hover{opacity:.9}
.form-actions .cancel:hover{border-color:var(--text-dim)}
.toast{position:fixed;bottom:20px;right:20px;padding:10px 16px;border-radius:8px;font-size:12px;opacity:0;transition:opacity .3s;pointer-events:none;z-index:100}
.toast.show{opacity:1}
.toast.error{background:var(--high);color:#fff}
.toast.success{background:var(--done);color:#fff}
.kbd-hint{position:fixed;bottom:14px;left:20px;font-size:10px;color:var(--text-dim);opacity:.5;display:flex;gap:14px}
.kbd-hint span{display:flex;align-items:center;gap:4px}
.kbd-hint kbd{border:1px solid var(--border);padding:1px 5px;border-radius:3px;font-family:inherit;font-size:9px}
@keyframes cardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:768px){.board{grid-template-columns:1fr;gap:12px;padding:12px}.search-wrap input.open{width:120px}.kbd-hint{display:none}}
</style>
</head>
<body>
<header>
<div class="header-left">
<div class="logo"><span>&#x1F43E;</span> ${safeBotName}</div>
<span class="task-count" id="taskCount">0 tasks</span>
</div>
<div class="header-right">
<div class="search-wrap">
<span class="search-icon">&#x1F50D;</span>
<input type="text" id="search" placeholder="Search tasks...">
</div>
<div class="theme-switcher">
<div class="theme-dot${theme === "paw" ? " active" : ""}" data-theme="paw" title="Paw"></div>
<div class="theme-dot${theme === "midnight" ? " active" : ""}" data-theme="midnight" title="Midnight"></div>
<div class="theme-dot${theme === "neon" ? " active" : ""}" data-theme="neon" title="Neon"></div>
<div class="theme-dot${theme === "rose" ? " active" : ""}" data-theme="rose" title="Rose"></div>
</div>
<button class="settings-btn" id="settingsBtn">&#x2699;</button>
</div>
</header>
<div class="board" id="board"></div>
<div class="toast" id="toast"></div>
<div class="kbd-hint"><span><kbd>N</kbd> New task</span><span><kbd>/</kbd> Search</span><span><kbd>Esc</kbd> Close</span></div>
<div class="settings-overlay" id="settingsOverlay"></div>
<div class="settings-panel" id="settingsPanel">
<div class="settings-title">Settings <button class="settings-close" id="settingsClose">&#x2715;</button></div>
<div>
<div class="settings-label">Bot Name</div>
<input class="settings-input" id="botNameInput" type="text" value="${safeBotName}" maxlength="20" placeholder="Paw">
</div>
<div>
<div class="settings-label">Theme</div>
<div class="settings-themes">
<div class="settings-theme${theme === "paw" ? " active" : ""}" data-theme="paw" style="color:#b4783c">Paw</div>
<div class="settings-theme${theme === "midnight" ? " active" : ""}" data-theme="midnight" style="color:#6688cc">Midnight</div>
<div class="settings-theme${theme === "neon" ? " active" : ""}" data-theme="neon" style="color:#00ff88">Neon</div>
<div class="settings-theme${theme === "rose" ? " active" : ""}" data-theme="rose" style="color:#d4688a">Rose</div>
</div>
</div>
</div>
<script>
var BOTNAME = "${safeBotName}";
var tasks = [];
var dragId = null;
var searchQuery = "";

function toast(msg, type) {
  var el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast show " + (type || "success");
  setTimeout(function() { el.className = "toast"; }, 2000);
}

function api(path, opts) {
  return fetch("/api/" + path, Object.assign({ headers: {"Content-Type": "application/json"} }, opts || {}))
    .then(function(r) {
      if (!r.ok) throw new Error("Request failed: " + r.status);
      return r.json();
    })
    .catch(function(err) {
      toast(err.message, "error");
      throw err;
    });
}

function load() {
  api("tasks").then(function(data) {
    tasks = data;
    render();
  });
}

function esc(s) {
  var d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function timeAgo(iso) {
  var diff = Date.now() - new Date(iso).getTime();
  var m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  var h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  var d = Math.floor(h / 24);
  if (d < 30) return d + "d ago";
  return Math.floor(d / 30) + "mo ago";
}

var emptyMsgs = {
  "todo": "Nothing planned yet.\\nPress N to add a task! &#x1F43E;",
  "in-progress": "Nothing in progress.\\nDrag a task here to start working.",
  "done": "No completed tasks yet.\\nShip something! &#x1F680;"
};

function render() {
  var statuses = ["todo", "in-progress", "done"];
  var labels = { "todo": "Todo", "in-progress": "In Progress", "done": "Done" };
  var colClass = { "todo": "col-todo", "in-progress": "col-progress", "done": "col-done" };
  var board = document.getElementById("board");
  board.innerHTML = "";

  var totalCount = tasks.length;
  var doneCount = tasks.filter(function(t) { return t.status === "done"; }).length;
  document.getElementById("taskCount").textContent = totalCount === 0 ? "0 tasks" : doneCount + "/" + totalCount + " done";

  statuses.forEach(function(status) {
    var filtered = tasks.filter(function(t) {
      if (t.status !== status) return false;
      if (searchQuery) {
        var q = searchQuery.toLowerCase();
        return (t.title.toLowerCase().indexOf(q) !== -1) || (t.description && t.description.toLowerCase().indexOf(q) !== -1);
      }
      return true;
    }).sort(function(a, b) { return a.order - b.order; });

    var col = document.createElement("div");
    col.className = "column " + colClass[status];
    col.setAttribute("data-status", status);

    // Header
    var header = document.createElement("div");
    header.className = "col-header";
    header.innerHTML = '<span class="col-title">' + labels[status] + '</span><span class="col-count">' + filtered.length + '</span>';
    col.appendChild(header);

    // Cards container
    var cardsDiv = document.createElement("div");
    cardsDiv.className = "cards";

    if (filtered.length === 0) {
      cardsDiv.innerHTML = '<div class="empty">' + emptyMsgs[status] + '</div>';
    } else {
      filtered.forEach(function(task) {
        var card = document.createElement("div");
        card.className = "card";
        card.draggable = true;
        card.setAttribute("data-id", task.id);

        var titleDiv = document.createElement("div");
        titleDiv.className = "card-title";
        titleDiv.contentEditable = "true";
        titleDiv.textContent = task.title;
        titleDiv.addEventListener("blur", function() {
          var newTitle = this.textContent.trim();
          if (newTitle && newTitle !== task.title) {
            api("tasks/" + task.id, { method: "PUT", body: JSON.stringify({ title: newTitle }) });
            task.title = newTitle;
          }
        });
        titleDiv.addEventListener("keydown", function(e) {
          if (e.key === "Enter") { e.preventDefault(); this.blur(); }
        });
        card.appendChild(titleDiv);

        if (task.description) {
          var descDiv = document.createElement("div");
          descDiv.className = "card-desc";
          descDiv.contentEditable = "true";
          descDiv.textContent = task.description;
          descDiv.addEventListener("blur", function() {
            var newDesc = this.textContent.trim();
            api("tasks/" + task.id, { method: "PUT", body: JSON.stringify({ description: newDesc || undefined }) });
            task.description = newDesc || undefined;
          });
          card.appendChild(descDiv);
        }

        var footer = document.createElement("div");
        footer.className = "card-footer";

        var meta = document.createElement("div");
        meta.className = "card-meta";

        var priorityDiv = document.createElement("div");
        priorityDiv.className = "priority";
        ["high", "normal", "low"].forEach(function(p) {
          var dot = document.createElement("div");
          dot.className = "priority-dot " + p + (task.priority === p ? " active" : "");
          dot.title = p.charAt(0).toUpperCase() + p.slice(1);
          dot.addEventListener("click", function(e) {
            e.stopPropagation();
            api("tasks/" + task.id, { method: "PUT", body: JSON.stringify({ priority: p }) }).then(function() {
              task.priority = p;
              render();
            });
          });
          priorityDiv.appendChild(dot);
        });
        meta.appendChild(priorityDiv);

        var timeSpan = document.createElement("span");
        timeSpan.className = "card-time";
        timeSpan.textContent = timeAgo(task.createdAt);
        meta.appendChild(timeSpan);

        footer.appendChild(meta);

        var delBtn = document.createElement("span");
        delBtn.className = "card-delete";
        delBtn.innerHTML = "&#x2715;";
        delBtn.addEventListener("click", function(e) {
          e.stopPropagation();
          api("tasks/" + task.id, { method: "DELETE" }).then(function() {
            tasks = tasks.filter(function(t) { return t.id !== task.id; });
            render();
          });
        });
        footer.appendChild(delBtn);
        card.appendChild(footer);

        // Drag events
        card.addEventListener("dragstart", function(e) {
          dragId = task.id;
          this.classList.add("dragging");
          e.dataTransfer.effectAllowed = "move";
        });
        card.addEventListener("dragend", function() {
          this.classList.remove("dragging");
          dragId = null;
          document.querySelectorAll(".column").forEach(function(c) { c.classList.remove("drag-over"); });
        });

        cardsDiv.appendChild(card);
      });
    }
    col.appendChild(cardsDiv);

    // Add button
    var addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "add-btn";
    addBtn.textContent = "+ Add task";
    addBtn.addEventListener("click", function() {
      formDiv.classList.add("show");
      titleInput.focus();
    });
    col.appendChild(addBtn);

    // Add form
    var formDiv = document.createElement("div");
    formDiv.className = "add-form";

    var titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.placeholder = "Task title...";
    titleInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") doSave();
      if (e.key === "Escape") closeForm();
    });
    formDiv.appendChild(titleInput);

    var descInput = document.createElement("textarea");
    descInput.placeholder = "Description (optional)";
    descInput.rows = 2;
    descInput.addEventListener("keydown", function(e) {
      if (e.key === "Escape") closeForm();
    });
    formDiv.appendChild(descInput);

    var actions = document.createElement("div");
    actions.className = "form-actions";

    var cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "cancel";
    cancelBtn.textContent = "Cancel";

    function closeForm() {
      formDiv.classList.remove("show");
      titleInput.value = "";
      descInput.value = "";
    }

    cancelBtn.addEventListener("click", closeForm);
    actions.appendChild(cancelBtn);

    var saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "save";
    saveBtn.textContent = "Add";

    function doSave() {
      var title = titleInput.value.trim();
      if (!title) return;
      var desc = descInput.value.trim();
      saveBtn.disabled = true;
      saveBtn.textContent = "...";
      var body = { title: title, status: status, priority: "normal" };
      if (desc) body.description = desc;
      api("tasks", { method: "POST", body: JSON.stringify(body) })
        .then(function(task) {
          tasks.push(task);
          render();
          toast("Task added!");
        })
        .catch(function() {
          saveBtn.disabled = false;
          saveBtn.textContent = "Add";
        });
    }

    saveBtn.addEventListener("click", doSave);
    actions.appendChild(saveBtn);
    formDiv.appendChild(actions);
    col.appendChild(formDiv);

    // Drop events on column
    col.addEventListener("dragover", function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      this.classList.add("drag-over");
    });
    col.addEventListener("dragleave", function() {
      this.classList.remove("drag-over");
    });
    col.addEventListener("drop", function(e) {
      e.preventDefault();
      this.classList.remove("drag-over");
      if (!dragId) return;
      var newStatus = this.getAttribute("data-status");
      var order = tasks.filter(function(t) { return t.status === newStatus; }).length;
      api("tasks/" + dragId, { method: "PUT", body: JSON.stringify({ status: newStatus, order: order }) })
        .then(function() {
          var task = tasks.find(function(t) { return t.id === dragId; });
          if (task) { task.status = newStatus; task.order = order; }
          render();
        });
    });

    board.appendChild(col);
  });
}

// Theme switcher (dots in header)
document.querySelectorAll(".theme-dot").forEach(function(dot) {
  dot.addEventListener("click", function() {
    var t = this.getAttribute("data-theme");
    api("config", { method: "PUT", body: JSON.stringify({ theme: t }) }).then(function() {
      window.location.href = "/?theme=" + t;
    });
  });
});

// Settings panel
var settingsBtn = document.getElementById("settingsBtn");
var settingsPanel = document.getElementById("settingsPanel");
var settingsOverlay = document.getElementById("settingsOverlay");
var settingsClose = document.getElementById("settingsClose");

function openSettings() { settingsPanel.classList.add("open"); settingsOverlay.classList.add("open"); }
function closeSettings() { settingsPanel.classList.remove("open"); settingsOverlay.classList.remove("open"); }

settingsBtn.addEventListener("click", openSettings);
settingsClose.addEventListener("click", closeSettings);
settingsOverlay.addEventListener("click", closeSettings);

// Settings theme buttons
document.querySelectorAll(".settings-theme").forEach(function(el) {
  el.addEventListener("click", function() {
    var t = this.getAttribute("data-theme");
    api("config", { method: "PUT", body: JSON.stringify({ theme: t }) }).then(function() {
      window.location.href = "/?theme=" + t;
    });
  });
});

// Bot name change
var botNameInput = document.getElementById("botNameInput");
var botNameTimer = null;
botNameInput.addEventListener("input", function() {
  clearTimeout(botNameTimer);
  var val = this.value.trim();
  botNameTimer = setTimeout(function() {
    if (val) {
      api("config", { method: "PUT", body: JSON.stringify({ botName: val }) }).then(function() {
        document.querySelector(".logo").innerHTML = '<span>&#x1F43E;</span> ' + esc(val);
        BOTNAME = val;
        document.title = val + " \\u2014 Task Dashboard";
        toast("Name updated!");
      });
    }
  }, 600);
});

// Search
var searchInput = document.getElementById("search");
var searchIcon = document.querySelector(".search-icon");

function openSearch() {
  searchInput.classList.add("open");
  searchInput.focus();
}
function closeSearch() {
  searchInput.classList.remove("open");
  searchInput.value = "";
  searchQuery = "";
  render();
}

searchIcon.addEventListener("click", openSearch);
searchInput.addEventListener("input", function() {
  searchQuery = this.value;
  render();
});
searchInput.addEventListener("keydown", function(e) {
  if (e.key === "Escape") closeSearch();
});

// Keyboard shortcuts
document.addEventListener("keydown", function(e) {
  // Don't trigger shortcuts when typing in inputs
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.contentEditable === "true") {
    if (e.key === "Escape") e.target.blur();
    return;
  }

  if (e.key === "n" || e.key === "N") {
    e.preventDefault();
    var firstAddBtn = document.querySelector(".col-todo .add-btn");
    if (firstAddBtn) firstAddBtn.click();
  }

  if (e.key === "/") {
    e.preventDefault();
    openSearch();
  }

  if (e.key === "Escape") {
    closeSearch();
    closeSettings();
    document.querySelectorAll(".add-form.show").forEach(function(f) { f.classList.remove("show"); });
  }
});

load();
</script>
</body>
</html>`;
}

export function generateFocusTimerHTML(
	theme: DashboardTheme,
	botName: string,
	endsAt: string,
	duration: string,
): string {
	const t = THEME_COLORS[theme];
	const safeBotName = botName.replace(/[&<>"']/g, "");
	const safeEndsAt = endsAt.replace(/[&<>"']/g, "");
	const safeDuration = duration.replace(/[^0-9]/g, "");
	const catArt = "\u2800\u2800\u2800\u2800\u2800\u2800\u2880\u28c0\u2820\u2810\u2808\u2804\u2802\u2801\u2801\u2802\u2804\u2808\u2810\u2820\u2840\u2880\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2801\u2802\u2804\u2808\u2810\u2820\u28c0\u2880\u2801\u2802\u2804\u2808\u2810\u2820\u2840\u2880\u2800\u2800\u2800\u2800\u2800\n\u2800\u2800\u2800\u2800\u2860\u280b\u2801\u2800\u2800\u2880\u28c0\u28e0\u2800\u2800\u2800\u2880\u28c0\u28c0\u2800\u2800\u2808\u2877\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u28f4\u2809\u2800\u28c0\u28e0\u28c0\u2800\u2800\u2808\u2833\u2800\u2800\u2800\u28c0\u28c0\u2800\u2800\u2800\u283e\u2846\u2800\u2800\u2800\u2800\n\u2800\u2800\u2800\u28f8\u280f\u2800\u28e4\u2831\u2808\u2805\u280b\u2801\u2800\u2800\u2832\u280e\u2801\u2824\u2818\u2833\u2800\u2800\u28bf\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2880\u287f\u2801\u2862\u281e\u2841\u2818\u2825\u280b\u2800\u2800\u28e4\u2831\u2809\u2818\u2825\u281e\u2845\u2800\u2800\u28f8\u2844\u2800\u2800\u2800\n\u2800\u2800\u2880\u28fd\u2841\u2800\u28bf\u2840\u2800\u2818\u2844\u2845\u2800\u2800\u28f8\u2866\u2847\u2800\u2880\u2866\u28bf\u2800\u2800\u28bf\u2844\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u28e8\u28c7\u2800\u28f8\u28cf\u2800\u2818\u2862\u28f8\u2800\u2800\u2897\u2858\u2880\u2800\u2818\u2844\u28bf\u2800\u2800\u28f8\u28c7\u2800\u2800\u2800\n\u2800\u28f0\u2809\u280b\u2877\u2800\u281b\u28bf\u28e6\u2884\u2863\u2845\u2800\u2800\u2838\u2887\u28f0\u2864\u28b4\u287f\u2801\u2800\u2874\u280b\u2801\u2809\u2871\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2880\u280e\u2809\u283b\u2846\u2809\u28bf\u28f3\u2864\u2863\u28fc\u2801\u2800\u287b\u2841\u28e6\u28bc\u287f\u2803\u2800\u2874\u280b\u2801\u280b\u28e6\u2800\n\u28fa\u2801\u2800\u2860\u2809\u2836\u28e4\u2809\u2801\u2813\u281b\u280b\u2801\u2860\u2809\u2836\u2864\u2800\u2800\u28b7\u2800\u2800\u2800\u287f\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2890\u287f\u2800\u2880\u2809\u2836\u2864\u2809\u2801\u2813\u283b\u280b\u2860\u2809\u2836\u28e4\u2809\u2801\u2809\u280b\u28e6\u2800\u2800\u28a8\u2846\n\u28fd\u2800\u28f8\u2804\u2823\u2810\u28f9\u2800\u2864\u280f\u2801\u2880\u2880\u2818\u2880\u2809\u2866\u2844\u28f9\u2841\u2814\u2841\u28c7\u2800\u28f8\u2845\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u28f8\u2845\u2800\u2897\u2818\u2844\u2838\u28c7\u2800\u2860\u280f\u2809\u2810\u2804\u2841\u2809\u2866\u2800\u2818\u2844\u2838\u28c7\u2800\u2800\u28bf\n\u2809\u28b7\u2840\u28bf\u28e4\u28b4\u280f\u28be\u2841\u2810\u2880\u2800\u2818\u2804\u2880\u2809\u2844\u28f9\u28bf\u28e4\u28b4\u287f\u2801\u2862\u280f\u2801\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2809\u28b7\u2840\u287f\u28e6\u28bc\u28f3\u28cf\u2800\u2818\u2801\u2880\u2818\u2818\u2884\u2809\u2862\u28c6\u287f\u2864\u28b6\u287e\u2801\u28fc\u2803\n\u2800\u28f8\u28b7\u2809\u2809\u2809\u28f8\u280f\u28c6\u2800\u2860\u2818\u2880\u2809\u2818\u2846\u28c8\u28be\u2809\u2809\u2809\u2874\u280f\u2844\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2880\u287f\u2846\u2809\u2809\u2801\u28be\u28f3\u2800\u2840\u2818\u2844\u2809\u2862\u280b\u2844\u28bf\u2800\u2809\u2809\u2821\u287e\u2845\u2800\n\u2810\u2845\u2800\u2800\u2800\u2800\u2838\u28bf\u281e\u28e6\u28b4\u2862\u28f0\u2876\u28bf\u280f\u2800\u2800\u2800\u2800\u2800\u2800\u28f0\u2846\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u28ba\u2800\u2800\u2800\u2800\u2800\u287b\u28f7\u28b6\u28e6\u2888\u2886\u2864\u28ae\u28bf\u2803\u2800\u2800\u2800\u2800\u2800\u28f8\u2800\n\u2800\u2838\u2844\u2800\u2800\u2800\u2800\u2809\u287b\u2836\u28ee\u28dd\u28bb\u28f3\u28e7\u280f\u2801\u2800\u2800\u2800\u2800\u2860\u280f\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2823\u2844\u2800\u2800\u2800\u2800\u280b\u2877\u28ae\u28fd\u28bb\u283f\u28f7\u2836\u280b\u2800\u2800\u2800\u2800\u2800\u287c\u2803\u2800\n\u2800\u2800\u2809\u28c7\u2862\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2801\u2800\u2800\u2800\u2800\u2840\u28be\u280f\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u287b\u2846\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2809\u2800\u2800\u2800\u2800\u2880\u2874\u280f\u2801\u2800\u2800\n\u2800\u2800\u2800\u28f8\u280f\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u280b\u28bf\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u28a8\u2877\u2801\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2809\u287b\u2847\u2800\u2800\u2800\n\u2800\u2800\u2800\u28f8\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u28bf\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2845\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u28f8\u2845\u2800\u2800\u2800\n\u2800\u2800\u2800\u28fd\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u28be\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2868\u2845\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u28f0\u2845\u2800\u2800\u2800";

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeBotName} — Locked In</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐾</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{
font-family:'JetBrains Mono',monospace;
background:${t.bg};color:${t.text};
min-height:100vh;display:flex;flex-direction:column;
align-items:center;justify-content:center;
overflow:hidden;
}
.container{text-align:center;position:relative;z-index:1;padding:12px 16px}
.cat{font-size:7px;line-height:1.2;color:${t.accent};white-space:pre;margin:0 auto 14px;animation:breathe 4s ease-in-out infinite;text-shadow:0 0 0 transparent}
.label{font-size:11px;text-transform:uppercase;letter-spacing:3px;color:${t.accent};font-weight:600;margin-bottom:8px}
.timer{font-size:48px;font-weight:700;letter-spacing:4px;color:${t.text};line-height:1;margin-bottom:8px;font-variant-numeric:tabular-nums}
.progress{width:200px;height:3px;background:${t.border};border-radius:2px;margin:0 auto 10px;overflow:hidden}
.progress-fill{height:100%;background:${t.accent};border-radius:2px;width:0%;transition:width 1s linear}
.sub{font-size:11px;color:${t.textDim};margin-bottom:12px}
.quote{font-size:10px;color:${t.textDim};font-style:italic;height:14px;transition:opacity .8s}
.session-info{font-size:10px;color:${t.textDim};display:flex;gap:16px;justify-content:center;margin-top:12px}
.session-info span{display:flex;align-items:center;gap:5px}
.dot{width:5px;height:5px;border-radius:50%;background:${t.accent};animation:pulse 2s ease-in-out infinite}
.complete .cat{color:${t.done};animation:none;text-shadow:0 0 12px ${t.done}40}
.complete .label{color:${t.done}}
.complete .timer{color:${t.done}}
.complete .dot{background:${t.done};animation:none}
.complete .progress-fill{background:${t.done}}
@keyframes breathe{0%,100%{opacity:.6;text-shadow:0 0 0 transparent}50%{opacity:1;text-shadow:0 0 15px ${t.accent}30}}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes flash{0%,100%{opacity:1}50%{opacity:.3}}
.flash .timer{animation:flash .5s ease-in-out 3}
.glow{position:fixed;width:200px;height:200px;border-radius:50%;background:${t.accent};opacity:.03;filter:blur(80px);pointer-events:none}
.glow-1{top:-60px;left:-60px}
.glow-2{bottom:-60px;right:-60px}
</style>
</head>
<body>
<div class="glow glow-1"></div>
<div class="glow glow-2"></div>
<div class="container" id="container">
<pre class="cat" id="cat"></pre>
<div class="label" id="label">Locked In</div>
<div class="timer" id="timer">--:--</div>
<div class="progress"><div class="progress-fill" id="progress"></div></div>
<div class="sub" id="sub">${safeDuration} min session</div>
<div class="quote" id="quote"></div>
<div class="session-info">
<span><span class="dot"></span> Focus active</span>
</div>
</div>
<script>
var catArt = ${JSON.stringify(catArt)};
document.getElementById("cat").textContent = catArt;

var endsAt = "${safeEndsAt}";
var durationMs = ${safeDuration} * 60000;
var endTime = endsAt ? new Date(endsAt).getTime() : 0;
var startTime = endTime - durationMs;
var done = false;
var progressEl = document.getElementById("progress");
var quotes = [
  "Deep work is the superpower of the 21st century.",
  "Focus is not about saying yes. It\u2019s about saying no.",
  "The successful warrior is the average person with laser focus.",
  "What you stay focused on will grow.",
  "Starve your distractions. Feed your focus.",
  "Small daily improvements lead to stunning results.",
  "You don\u2019t need more time. You need more focus.",
  "Discipline is choosing what you want most over what you want now."
];
var qIdx = 0;

function pad(n) { return n < 10 ? "0" + n : "" + n; }

function tick() {
  if (!endTime || done) return;
  var now = Date.now();
  var diff = endTime - now;
  var elapsed = now - startTime;
  var pct = Math.min(100, Math.max(0, (elapsed / durationMs) * 100));
  progressEl.style.width = pct + "%";

  if (diff <= 0) {
    done = true;
    document.getElementById("timer").textContent = "00:00";
    document.getElementById("label").textContent = "Session Complete";
    document.getElementById("sub").textContent = "Great work! Take a break.";
    document.getElementById("container").classList.add("complete", "flash");
    document.title = "${safeBotName} \u2014 Done!";
    progressEl.style.width = "100%";
    return;
  }

  var h = Math.floor(diff / 3600000);
  var m = Math.floor((diff % 3600000) / 60000);
  var s = Math.floor((diff % 60000) / 1000);
  document.getElementById("timer").textContent = h > 0 ? pad(h) + ":" + pad(m) + ":" + pad(s) : pad(m) + ":" + pad(s);
}

function rotateQuote() {
  var el = document.getElementById("quote");
  el.style.opacity = "0";
  setTimeout(function() {
    el.textContent = quotes[qIdx % quotes.length];
    el.style.opacity = "1";
    qIdx++;
  }, 800);
}

tick();
setInterval(tick, 1000);
rotateQuote();
setInterval(rotateQuote, 12000);
</script>
</body>
</html>`;
}
