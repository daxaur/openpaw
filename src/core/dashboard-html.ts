import type { DashboardTheme } from "../types.js";

export function generateDashboardHTML(
	theme: DashboardTheme,
	botName: string,
): string {
	const themes: Record<
		DashboardTheme,
		{
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
	> = {
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

	const t = themes[theme];

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${botName} — Task Dashboard</title>
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
</style>
</head>
<body>
<header>
<div class="logo"><span>&#x1F43E;</span> ${botName}</div>
<div class="theme-switcher">
<div class="theme-dot${theme === "paw" ? " active" : ""}" data-theme="paw" title="Paw"></div>
<div class="theme-dot${theme === "midnight" ? " active" : ""}" data-theme="midnight" title="Midnight"></div>
<div class="theme-dot${theme === "neon" ? " active" : ""}" data-theme="neon" title="Neon"></div>
</div>
</header>
<div class="board">
<div class="column col-todo" data-status="todo">
<div class="col-header"><span class="col-title">Todo</span><span class="col-count" id="count-todo">0</span></div>
<div class="cards" id="cards-todo"></div>
<button class="add-btn" onclick="showForm('todo')">+ Add task</button>
<div class="add-form" id="form-todo">
<input type="text" id="input-todo" placeholder="Task title..." onkeydown="if(event.key==='Enter')saveNew('todo')">
<textarea id="desc-todo" placeholder="Description (optional)" rows="2"></textarea>
<div class="form-actions">
<button class="cancel" onclick="hideForm('todo')">Cancel</button>
<button class="save" onclick="saveNew('todo')">Add</button>
</div>
</div>
</div>
<div class="column col-progress" data-status="in-progress">
<div class="col-header"><span class="col-title">In Progress</span><span class="col-count" id="count-in-progress">0</span></div>
<div class="cards" id="cards-in-progress"></div>
<button class="add-btn" onclick="showForm('in-progress')">+ Add task</button>
<div class="add-form" id="form-in-progress">
<input type="text" id="input-in-progress" placeholder="Task title..." onkeydown="if(event.key==='Enter')saveNew('in-progress')">
<textarea id="desc-in-progress" placeholder="Description (optional)" rows="2"></textarea>
<div class="form-actions">
<button class="cancel" onclick="hideForm('in-progress')">Cancel</button>
<button class="save" onclick="saveNew('in-progress')">Add</button>
</div>
</div>
</div>
<div class="column col-done" data-status="done">
<div class="col-header"><span class="col-title">Done</span><span class="col-count" id="count-done">0</span></div>
<div class="cards" id="cards-done"></div>
<button class="add-btn" onclick="showForm('done')">+ Add task</button>
<div class="add-form" id="form-done">
<input type="text" id="input-done" placeholder="Task title..." onkeydown="if(event.key==='Enter')saveNew('done')">
<textarea id="desc-done" placeholder="Description (optional)" rows="2"></textarea>
<div class="form-actions">
<button class="cancel" onclick="hideForm('done')">Cancel</button>
<button class="save" onclick="saveNew('done')">Add</button>
</div>
</div>
</div>
</div>
<script>
let tasks=[];
let dragId=null;

async function api(path,opts){
const r=await fetch('/api/'+path,{headers:{'Content-Type':'application/json'},...opts});
return r.json();
}

async function load(){
tasks=await api('tasks');
render();
}

function render(){
for(const s of['todo','in-progress','done']){
const container=document.getElementById('cards-'+s);
const filtered=tasks.filter(t=>t.status===s).sort((a,b)=>a.order-b.order);
document.getElementById('count-'+s).textContent=filtered.length;
if(filtered.length===0){
container.innerHTML='<div class="empty">No tasks here yet.<br>${botName} is waiting for work! &#x1F43E;</div>';
}else{
container.innerHTML=filtered.map(t=>\`
<div class="card" draggable="true" data-id="\${t.id}" ondragstart="onDragStart(event)" ondragend="onDragEnd(event)">
<div class="card-title" contenteditable="true" onblur="updateTitle('\${t.id}',this.textContent)">\${esc(t.title)}</div>
\${t.description?'<div class="card-desc" contenteditable="true" onblur="updateDesc(\\''+t.id+'\\',this.textContent)">'+esc(t.description)+'</div>':''}
<div class="card-footer">
<div class="priority">
<div class="priority-dot high\${t.priority==='high'?' active':''}" onclick="setPriority('\${t.id}','high')" title="High"></div>
<div class="priority-dot normal\${t.priority==='normal'?' active':''}" onclick="setPriority('\${t.id}','normal')" title="Normal"></div>
<div class="priority-dot low\${t.priority==='low'?' active':''}" onclick="setPriority('\${t.id}','low')" title="Low"></div>
</div>
<span class="card-delete" onclick="del('\${t.id}')">&#x2715;</span>
</div>
</div>
\`).join('');
}
}
}

function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}

function showForm(s){document.getElementById('form-'+s).classList.add('show');document.getElementById('input-'+s).focus()}
function hideForm(s){document.getElementById('form-'+s).classList.remove('show');document.getElementById('input-'+s).value='';document.getElementById('desc-'+s).value=''}

async function saveNew(status){
const title=document.getElementById('input-'+status).value.trim();
if(!title)return;
const desc=document.getElementById('desc-'+status).value.trim();
const task=await api('tasks',{method:'POST',body:JSON.stringify({title,description:desc||undefined,status,priority:'normal'})});
tasks.push(task);
render();
hideForm(status);
}

async function updateTitle(id,title){
title=title.trim();if(!title)return;
await api('tasks/'+id,{method:'PUT',body:JSON.stringify({title})});
const t=tasks.find(x=>x.id===id);if(t)t.title=title;
}

async function updateDesc(id,desc){
desc=desc.trim();
await api('tasks/'+id,{method:'PUT',body:JSON.stringify({description:desc||undefined})});
const t=tasks.find(x=>x.id===id);if(t)t.description=desc||undefined;
}

async function setPriority(id,priority){
await api('tasks/'+id,{method:'PUT',body:JSON.stringify({priority})});
const t=tasks.find(x=>x.id===id);if(t)t.priority=priority;
render();
}

async function del(id){
await api('tasks/'+id,{method:'DELETE'});
tasks=tasks.filter(t=>t.id!==id);
render();
}

function onDragStart(e){
dragId=e.target.dataset.id;
e.target.classList.add('dragging');
e.dataTransfer.effectAllowed='move';
}

function onDragEnd(e){
e.target.classList.remove('dragging');
dragId=null;
document.querySelectorAll('.column').forEach(c=>c.classList.remove('drag-over'));
}

document.querySelectorAll('.column').forEach(col=>{
col.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move';col.classList.add('drag-over')});
col.addEventListener('dragleave',()=>col.classList.remove('drag-over'));
col.addEventListener('drop',async e=>{
e.preventDefault();col.classList.remove('drag-over');
if(!dragId)return;
const status=col.dataset.status;
const order=tasks.filter(t=>t.status===status).length;
await api('tasks/'+dragId,{method:'PUT',body:JSON.stringify({status,order})});
const t=tasks.find(x=>x.id===dragId);
if(t){t.status=status;t.order=order}
render();
});
});

document.querySelectorAll('.theme-dot').forEach(dot=>{
dot.addEventListener('click',()=>{
window.location.href='/?theme='+dot.dataset.theme;
});
});

load();
</script>
</body>
</html>`;
}
