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
.logo{display:flex;align-items:center;gap:10px;font-size:18px;font-weight:700;color:var(--accent)}
.theme-switcher{display:flex;gap:8px}
.theme-dot{width:14px;height:14px;border-radius:50%;cursor:pointer;border:2px solid var(--border);transition:border-color .2s}
.theme-dot:hover,.theme-dot.active{border-color:var(--text)}
.theme-dot[data-theme="paw"]{background:#b4783c}
.theme-dot[data-theme="midnight"]{background:#6688cc}
.theme-dot[data-theme="neon"]{background:#00ff88}
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
.card{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;cursor:grab;transition:all .15s;position:relative}
.card:hover{border-color:var(--accent);transform:translateY(-1px)}
.card.dragging{opacity:.4;transform:scale(.95)}
.card-title{font-size:13px;font-weight:500;margin-bottom:6px;outline:none}
.card-title:focus{border-bottom:1px solid var(--accent)}
.card-desc{font-size:11px;color:var(--text-dim);margin-bottom:8px;outline:none}
.card-desc:focus{border-bottom:1px solid var(--accent)}
.card-footer{display:flex;align-items:center;justify-content:space-between}
.priority{display:flex;gap:4px}
.priority-dot{width:8px;height:8px;border-radius:50%;cursor:pointer;transition:transform .1s}
.priority-dot:hover{transform:scale(1.4)}
.priority-dot.high{background:var(--high)}
.priority-dot.normal{background:var(--accent)}
.priority-dot.low{background:var(--low)}
.priority-dot.active{box-shadow:0 0 0 2px var(--bg),0 0 0 4px currentColor}
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
</style>
</head>
<body>
<header>
<div class="logo"><span>&#x1F43E;</span> ${safeBotName}</div>
<div class="theme-switcher">
<div class="theme-dot${theme === "paw" ? " active" : ""}" data-theme="paw" title="Paw"></div>
<div class="theme-dot${theme === "midnight" ? " active" : ""}" data-theme="midnight" title="Midnight"></div>
<div class="theme-dot${theme === "neon" ? " active" : ""}" data-theme="neon" title="Neon"></div>
</div>
</header>
<div class="board" id="board"></div>
<div class="toast" id="toast"></div>
<script>
var BOTNAME = "${safeBotName}";
var tasks = [];
var dragId = null;

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

function render() {
  var statuses = ["todo", "in-progress", "done"];
  var labels = { "todo": "Todo", "in-progress": "In Progress", "done": "Done" };
  var colClass = { "todo": "col-todo", "in-progress": "col-progress", "done": "col-done" };
  var board = document.getElementById("board");
  board.innerHTML = "";

  statuses.forEach(function(status) {
    var filtered = tasks.filter(function(t) { return t.status === status; }).sort(function(a, b) { return a.order - b.order; });

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
      cardsDiv.innerHTML = '<div class="empty">No tasks here yet.<br>' + BOTNAME + ' is waiting for work! &#x1F43E;</div>';
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
        footer.appendChild(priorityDiv);

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
    });
    formDiv.appendChild(titleInput);

    var descInput = document.createElement("textarea");
    descInput.placeholder = "Description (optional)";
    descInput.rows = 2;
    formDiv.appendChild(descInput);

    var actions = document.createElement("div");
    actions.className = "form-actions";

    var cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", function() {
      formDiv.classList.remove("show");
      titleInput.value = "";
      descInput.value = "";
    });
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

// Theme switcher
document.querySelectorAll(".theme-dot").forEach(function(dot) {
  dot.addEventListener("click", function() {
    window.location.href = "/?theme=" + this.getAttribute("data-theme");
  });
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

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeBotName} — Locked In</title>
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
.container{text-align:center;position:relative;z-index:1}
.ring-wrap{position:relative;width:200px;height:200px;margin:0 auto 20px}
.ring-svg{width:200px;height:200px;transform:rotate(-90deg)}
.ring-bg{fill:none;stroke:${t.border};stroke-width:4}
.ring-fg{fill:none;stroke:${t.accent};stroke-width:4;stroke-linecap:round;transition:stroke-dashoffset 1s linear}
.paw-ascii{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:13px;line-height:1.15;color:${t.accent};white-space:pre;animation:breathe 4s ease-in-out infinite}
.trail{font-size:14px;color:${t.textDim};letter-spacing:8px;margin-bottom:16px;height:20px}
.trail span{display:inline-block;animation:walk 2s ease-in-out infinite}
.trail span:nth-child(1){animation-delay:0s}
.trail span:nth-child(2){animation-delay:.25s}
.trail span:nth-child(3){animation-delay:.5s}
.trail span:nth-child(4){animation-delay:.75s}
.trail span:nth-child(5){animation-delay:1s}
.label{font-size:12px;text-transform:uppercase;letter-spacing:3px;color:${t.accent};font-weight:600;margin-bottom:24px}
.timer{font-size:64px;font-weight:700;letter-spacing:4px;color:${t.text};line-height:1;margin-bottom:12px;font-variant-numeric:tabular-nums}
.sub{font-size:12px;color:${t.textDim};margin-bottom:20px}
.quote{font-size:11px;color:${t.textDim};font-style:italic;height:16px;transition:opacity .8s}
.session-info{font-size:11px;color:${t.textDim};display:flex;gap:20px;justify-content:center;margin-top:20px}
.session-info span{display:flex;align-items:center;gap:5px}
.dot{width:5px;height:5px;border-radius:50%;background:${t.accent};animation:pulse 2s ease-in-out infinite}
.complete .label{color:${t.done}}
.complete .timer{color:${t.done}}
.complete .dot{background:${t.done};animation:none}
.complete .ring-fg{stroke:${t.done}}
.complete .paw-ascii{color:${t.done};animation:none}
.complete .trail span{animation:none;color:${t.done}}
@keyframes breathe{0%,100%{opacity:.6;transform:translate(-50%,-50%) scale(.95)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}}
@keyframes walk{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes flash{0%,100%{opacity:1}50%{opacity:.3}}
.flash .timer{animation:flash .5s ease-in-out 3}
.glow{position:fixed;width:250px;height:250px;border-radius:50%;background:${t.accent};opacity:.03;filter:blur(80px);pointer-events:none}
.glow-1{top:-80px;left:-80px}
.glow-2{bottom:-80px;right:-80px}
.glow-3{top:50%;left:50%;transform:translate(-50%,-50%);opacity:.015}
</style>
</head>
<body>
<div class="glow glow-1"></div>
<div class="glow glow-2"></div>
<div class="glow glow-3"></div>
<div class="container" id="container">
<div class="ring-wrap">
<svg class="ring-svg" viewBox="0 0 200 200">
<circle class="ring-bg" cx="100" cy="100" r="90"/>
<circle class="ring-fg" id="ring" cx="100" cy="100" r="90" stroke-dasharray="565.49" stroke-dashoffset="565.49"/>
</svg>
<pre class="paw-ascii" id="paw">  __
 /  \\
| .. |
\\ -- /
 \\__/
  ||</pre>
</div>
<div class="trail" id="trail"><span>.</span><span>o</span><span>O</span><span>o</span><span>.</span></div>
<div class="label" id="label">Locked In</div>
<div class="timer" id="timer">--:--</div>
<div class="sub" id="sub">${safeDuration} min session</div>
<div class="quote" id="quote"></div>
<div class="session-info">
<span><span class="dot"></span> Focus active</span>
</div>
</div>
<script>
var endsAt = "${safeEndsAt}";
var durationMs = ${safeDuration} * 60000;
var endTime = endsAt ? new Date(endsAt).getTime() : 0;
var startTime = endTime - durationMs;
var circumference = 2 * Math.PI * 90;
var done = false;
var ring = document.getElementById("ring");
var quotes = [
  "Deep work is the superpower of the 21st century.",
  "Focus is not about saying yes. It's about saying no.",
  "The successful warrior is the average person with laser focus.",
  "What you stay focused on will grow.",
  "Starve your distractions. Feed your focus.",
  "Small daily improvements lead to stunning results.",
  "You don't need more time. You need more focus.",
  "Discipline is choosing what you want most over what you want now."
];
var qIdx = 0;

function pad(n) { return n < 10 ? "0" + n : "" + n; }

function updateRing(progress) {
  var offset = circumference * (1 - progress);
  ring.style.strokeDashoffset = Math.max(0, offset);
}

function tick() {
  if (!endTime || done) return;
  var now = Date.now();
  var diff = endTime - now;
  var elapsed = now - startTime;
  var progress = Math.min(1, Math.max(0, elapsed / durationMs));
  updateRing(progress);

  if (diff <= 0) {
    done = true;
    document.getElementById("timer").textContent = "00:00";
    document.getElementById("label").textContent = "Session Complete";
    document.getElementById("sub").textContent = "Great work! Take a break.";
    document.getElementById("paw").textContent = "  __\\n /  \\\\\\n| ^^ |\\n\\\\ \\u2323 /\\n \\\\__/\\n  ||";
    document.getElementById("container").classList.add("complete", "flash");
    document.title = "${safeBotName} \\u2014 Done!";
    updateRing(1);
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
