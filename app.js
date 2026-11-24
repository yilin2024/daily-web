"use strict";

const paths = {
  home:'<path d="m3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  tasks:'<rect x="4" y="4" width="16" height="17" rx="3"/><path d="m8 12 3 3 5-6"/>',
  folder:'<path d="M3 7V5a1 1 0 0 1 1-1h5l3 3h8a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v5m10-5v5M3 11h18"/>',
  chart:'<path d="M4 20h16M6 16v-4m6 4V8m6 8V4"/>',
  check:'<path d="m5 12 4.5 4.5L19 7"/>',
  complete:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
  book:'<path d="M3 4c3 0 6 0 9 2 3-2 6-2 9-2v15c-3 0-6 0-9 2-3-2-6-2-9-2zM12 6v15"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  screen:'<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 8h18M9 21h6m-3-3v3"/>',
  database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 4 16 4 16 0V5M4 12v7c0 4 16 4 16 0v-7"/>',
  user:'<circle cx="12" cy="8" r="3"/><path d="M5 20c0-7 14-7 14 0"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
  panel:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', close:'<path d="m6 6 12 12m0-12L6 18"/>',
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  moon:'<path d="M20.5 15.1A8.7 8.7 0 0 1 8.9 3.5 9 9 0 1 0 20.5 15.1Z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  droplet:'<path d="M12 2.5C10 6.6 5 10.5 5 14.5a7 7 0 1 0 14 0c0-4-5-7.9-7-12Z"/><path d="M8.5 14.6a3.5 3.5 0 0 0 3.5 3.6"/>',
  dropletOff:'<path d="M9.6 6.4A30 30 0 0 0 12 2.5c2 4.1 7 8 7 12M6.6 10.3A8 8 0 0 0 5 14.5a7 7 0 0 0 12.1 4.8M3 3l18 18"/>',
  pencil:'<path d="m5 15 11-11 4 4L9 19l-5 1zM14 6l4 4"/>'
};
const palette = {
  moss: {name:"Moss", accent:"#638258", tint:"#e7eedf"},
  clay: {name:"Clay", accent:"#b06e46", tint:"#f5e9dc"},
  iris: {name:"Iris", accent:"#82709a", tint:"#eee9f3"},
  lake: {name:"Lake", accent:"#587e8d", tint:"#e1edf0"},
  ochre: {name:"Ochre", accent:"#937832", tint:"#f4ecd4"}
};
const iconNames = {folder:"Folder",screen:"Website",book:"Notebook",layers:"Layers",chart:"Chart"};
const groups = ["To do","In progress","Done"];
const priorities = ["High","Medium","Low"];
const $ = selector => document.querySelector(selector);
const esc = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icon = name => '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">'+paths[name]+'</svg>';
const theme = key => '--accent:'+palette[key].accent+';--tint:'+palette[key].tint;
const id = () => crypto.randomUUID();
const dayKey = (date = new Date()) => [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
function relativeDay(offset) {
  const d = new Date();
  d.setDate(d.getDate()+offset);
  return dayKey(d);
}
const sampleProjects = [
  ["website","Portfolio website","Design and build my personal site.","moss","screen"],
  ["notes","Research notebook","Organize reading notes and open questions.","clay","book"],
  ["system","Design system","Build a reusable library of components.","iris","layers"]
];
function starter() {
  const projects = sampleProjects.map(([id,name,description,color,icon]) => ({id,name,description,color,icon,sample:true}));
  const task = (project,title,priority,due,status="To do") => ({id:id(),project,title,priority,due:relativeDay(due),status,sample:true});
  const tasks = [
    task("website","Sketch the homepage layout","High",0,"In progress"),
    task("notes","Summarize this week’s reading","Medium",0,"In progress"),
    task("system","Define the color palette","Low",0),
    task("website","Build the project gallery","Medium",2),task("notes","Outline the next research question","High",3),
    task("system","Document button states","Medium",4),
    task("website","Choose portfolio projects","Medium",-2,"Done"),task("website","Draft the about page","Low",-1,"Done"),
    task("website","Map the site structure","Medium",-3,"Done"),task("notes","Collect reading material","Low",-2,"Done"),
    task("system","Set up the component library","Low",-4,"Done"),task("system","Choose a type scale","Medium",-1,"Done")
  ];
  return {version:1,projects,tasks};
}

function validate(data) {
  const validId = value => typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
  const validText = value => typeof value === "string" && value.trim().length > 0;
  const validDay = value => value === "" || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && dayKey(new Date(value+"T12:00:00"))===value);
  if (!data || data.version!==1 || !Array.isArray(data.projects) || !Array.isArray(data.tasks)) throw Error("Unsupported workspace format.");
  const projectIds = new Set(), taskIds = new Set();
  for (const p of data.projects) {
    if (!p || !validId(p.id) || projectIds.has(p.id) || !validText(p.name) || typeof p.description!=="string" || !Object.hasOwn(palette,p.color) || !Object.hasOwn(iconNames,p.icon)) throw Error("Invalid project in workspace.");
    projectIds.add(p.id);
  }
  for (const t of data.tasks) {
    if (!t || !validId(t.id) || taskIds.has(t.id) || !validText(t.title) || (t.project!=="" && !projectIds.has(t.project)) || !priorities.includes(t.priority) || !groups.includes(t.status) || !validDay(t.due)) throw Error("Invalid task in workspace.");
    if (t.time !== undefined && t.time !== "" && (!t.due || typeof t.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(t.time))) throw Error("Invalid task time in workspace.");
    taskIds.add(t.id);
  }
  return data;
}

const storageKey = "fieldwork.v1:"+location.pathname.replace(/\/index\.html$/,"/").replace(/\/?$/,"/");
let state, stored, loadError = "";
function load() {
  try {
    stored = localStorage.getItem(storageKey);
    state = stored === null ? starter() : validate(JSON.parse(stored));
    if (stored === null) { stored=JSON.stringify(state); localStorage.setItem(storageKey,stored); }
  } catch {
    state = {version:1,projects:[],tasks:[]};
    loadError = "This browser could not load your workspace. Check browser storage or restore a backup in Workspace data.";
  }
}
function save(next, allowRestore=false) {
  try {
    const current = localStorage.getItem(storageKey);
    if (current!==stored) {
      state = current===null ? {version:1,projects:[],tasks:[]} : validate(JSON.parse(current));
      stored=current; render();
      alert("Your workspace changed in another tab. Review the latest version and try again.");
      return false;
    }
    if (loadError && !allowRestore) throw Error(loadError);
    validate(next);
    const raw = JSON.stringify(next);
    localStorage.setItem(storageKey,raw);
    state=next; stored=raw; loadError=""; return true;
  } catch (e) { alert("Could not save. "+e.message); return false; }
}
let route="welcome", projectId="", taskFilter="Open", focusFilter="Today", projectFilter="All", search="", toastTimer;
const appearanceKey = storageKey + ":appearance";
const rainKey = storageKey + ":rain";
const dialog = $("#editor");
const getProject = key => state.projects.find(p=>p.id===key);
const getTask = key => state.tasks.find(t=>t.id===key);
function progress(project) {
  const tasks = state.tasks.filter(t=>t.project===project.id);
  const done = tasks.filter(t=>t.status==="Done").length;
  const percent = tasks.length ? Math.round(100*done/tasks.length) : 0;
  const status = tasks.length && done===tasks.length ? "Complete" : tasks.some(t=>t.status!=="To do") ? "In progress" : "Planned";
  return {tasks,done,percent,status};
}
function plural(n,word){return n+" "+word+(n===1?"":"s");}
function notify(message) {
  clearTimeout(toastTimer); $("#message").textContent=message;
  toastTimer=setTimeout(()=>$("#message").textContent="",3000);
}
function setRoute(navigating = false){
  const previous = route;
  const previousFilter = taskFilter;
  const [page,key] = location.hash.slice(1).split("/");
  let nextRoute = "welcome";
  if (page === "project" && getProject(key)) nextRoute = "project";
  else if (["overview", "tasks", "projects", "calendar"].includes(page)) nextRoute = page;
  const changed = nextRoute !== route || (key || "") !== projectId;
  const hadQuery = projectFilter !== "All" || search !== "";
  if (changed) {taskFilter="Open";projectFilter="All";search="";}
  if (nextRoute === "tasks" && key === "today") taskFilter = "Today";
  if (nextRoute === "tasks" && key === "open") taskFilter = "Open";
  route=nextRoute;projectId=key||"";closeMenu();
  document.title = route === "welcome" ? "Yilin’s Daily Work · 日常工作手记" :
    (route === "project" ? getProject(projectId).name : sectionTitles[route]) + " · Yilin’s Daily Work";
  if (!navigating || previous === "project" || route === "project" || previous === "calendar" || route === "calendar" || previousFilter !== taskFilter || (changed && hadQuery)) render();
}
function applyAppearance(value) {
  const light = value === "light";
  document.documentElement.dataset.appearance = light ? "light" : "dark";
  $('meta[name="theme-color"]').setAttribute("content", light ? "#f8f8f6" : "#141414");
  document.querySelectorAll('[data-action="appearance"]').forEach(button => {
    const label = light ? "Switch to dark mode / 切换为深色模式" : "Switch to light mode / 切换为浅色模式";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = icon(light ? "moon" : "sun");
  });
}
function applyRain(visible) {
  $("#rain").hidden = !visible;
  const button = $('[data-action="rain"]');
  button.setAttribute("aria-pressed", String(visible));
  button.title = visible ? "Hide rain / 隐藏雨滴" : "Show rain / 显示雨滴";
  button.innerHTML = icon(visible ? "droplet" : "dropletOff");
}
function renderWelcome() {
  const today = dayKey();
  const openTasks = state.tasks.filter(task => task.status !== "Done");
  const date = $("#welcome-date");
  date.dateTime = today;
  date.textContent = new Date().toLocaleDateString("en-US", {weekday:"short", month:"short", day:"numeric"});
  $("#welcome-projects").textContent = state.projects.length;
  $("#welcome-open").textContent = openTasks.length;
  $("#welcome-today").textContent = openTasks.filter(task => task.due === today).length;
}
function closeMenu(){document.body.classList.remove("menu-open");$("#menu-btn").setAttribute("aria-expanded","false");$("#scrim").hidden=true;}

const sectionLinks = Array.from(document.querySelectorAll("#welcome-navigation a"));
const sidebarLinks = Array.from(document.querySelectorAll("#nav a"));
const heroDesk = $(".welcome-art");
const cornerDesk = $(".writing-corner");
const sectionTitles = {welcome:"Home", overview:"Overview", projects:"Projects", tasks:"My tasks", calendar:"Calendar"};

function syncSectionNavigation() {
  const header = $(".welcome-header");
  const nav = $("#welcome-navigation");
  const detail = route === "project";
  const standalone = detail || route === "calendar";
  let section = detail ? "projects" : route === "calendar" ? "calendar" : "welcome";
  if (!standalone) {
    // Use the same landing line as the anchors, including room below the pinned header.
    const landingLine = header.offsetHeight + 14;
    for (const link of sectionLinks.slice(1)) {
      const target = document.getElementById(link.hash.slice(1));
      if (target && target.getBoundingClientRect().top <= landingLine) section = target.id;
    }
  }
  cornerDesk.toggleAttribute("data-visible", standalone || heroDesk.getBoundingClientRect().bottom <= header.offsetHeight);
  const scrolled = standalone || window.scrollY > 8;
  if (header.hasAttribute("data-scrolled") !== scrolled) header.toggleAttribute("data-scrolled", scrolled);
  if (nav.dataset.section !== section) {
    nav.dataset.section = section;
    const marker = nav.querySelector(".nav-indicator");
    const active = sectionLinks.find(link => link.hash === "#" + section);
    if (active && active !== marker.parentElement) {
      const previous = marker.getBoundingClientRect();
      marker.getAnimations?.().forEach(animation => animation.cancel());
      active.prepend(marker);
      const next = marker.getBoundingClientRect();
      if (next.width && marker.animate && window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
        marker.animate([
          {transform: "translateX("+(previous.left-next.left)+"px) scaleX("+previous.width/next.width+")"},
          {transform: "none"}
        ], {duration:300, easing:"cubic-bezier(.2,.8,.2,1)"});
      }
    }
    for (const link of [...sectionLinks, ...sidebarLinks]) {
      if (link.hash === "#" + section) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }
  const label = detail ? getProject(projectId)?.name : sectionTitles[section === "welcome" ? "overview" : section];
  if (label && $("#crumb").textContent !== label) $("#crumb").textContent = label;
}

function scrollToRoute(behavior = "auto", focus = true) {
  const standalone = route === "project" || route === "calendar";
  const target = standalone ? $("#overview") : document.getElementById(route);
  target.scrollIntoView({block:"start", behavior});
  if (focus) (route === "welcome" ? $("#welcome-main") : standalone ? $("#main") : target).focus({preventScroll:true});
  syncSectionNavigation();
}

function render(){
  const detail = route === "project";
  const project = detail ? getProject(projectId) : null;
  if (detail && !project) { location.hash = "projects"; return; }
  $("#welcome").hidden = detail || route === "calendar";
  $("#workspace").hidden = false;
  $(".skip").href = route === "welcome" ? "#welcome-main" : "#main";
  renderWelcome();
  if (project) document.title = project.name + " · Yilin’s Daily Work";
  $("#project-nav").innerHTML=state.projects.map(p=>'<a class="project-link '+(project?.id===p.id?"active":"")+'" href="#project/'+p.id+'" style="'+theme(p.color)+'"><span class="dot"></span><span>'+esc(p.name)+'</span></a>').join("");
  $("#workspace-type").textContent = state.projects.some(p=>p.sample) || state.tasks.some(t=>t.sample) ? "Sample workspace" : "Saved in this browser";
  const main=$("#main");
  const focusedTask = document.activeElement.closest("#calendar button[data-action][data-key]");
  main.innerHTML = route === "calendar" ? calendarPage() : detail ? taskPage(project) : overview() +
    '<section id="projects" class="workspace-section" tabindex="-1" aria-labelledby="projects-title"><div class="section-heading"><h2 id="projects-title">Projects</h2><button class="secondary" data-action="new-project">'+icon("plus")+'New project</button></div>'+cards(state.projects)+'</section>'+
    '<section id="tasks" class="workspace-section" tabindex="-1" aria-labelledby="tasks-title">'+taskPage(null)+'</section>';
  syncSectionNavigation();
  if (route === "calendar" && focusedTask) {
    const {action, key} = focusedTask.dataset;
    const matches = main.querySelectorAll(`button[data-action="${action}"][data-key="${key}"]`);
    const nextFocus = Array.from(matches).find(button => button.getClientRects().length) || main.querySelector('.cal-modes [aria-pressed="true"]');
    nextFocus.focus({preventScroll:true});
  }
  if (loadError){const error=document.createElement("p");error.className="error";error.textContent=loadError;main.prepend(error);}
}
function statusPill(status){return '<span class="status '+(status==="Complete"?"complete":status==="In progress"?"active":"")+'">'+status+'</span>';}
function cards(projects){
  if (!projects.length) return '<div class="empty">Add a project to start tracking its tasks. <button class="text-btn" data-action="new-project">New project</button></div>';
  return '<div class="project-grid">'+projects.map(p=>{
    const {done,tasks,percent,status}=progress(p);
    return '<a class="project-card" style="'+theme(p.color)+'" href="#project/'+p.id+'"><div class="card-top"><span class="project-icon">'+icon(p.icon)+'</span>'+statusPill(status)+'</div><h3>'+esc(p.name)+'</h3><p>'+esc(p.description)+'</p><div class="track"><span style="width:'+percent+'%"></span></div><div class="card-foot"><span>'+done+' of '+plural(tasks.length,"task")+' done</span><strong>'+percent+'%</strong></div></a>';
  }).join("")+'</div>';
}
function sectionHead(title,url,label){return '<div class="section-heading"><h2>'+title+'</h2><a class="text-btn" href="#'+url+'">'+label+icon("arrow")+'</a></div>';}
function metric(n,label,symbol,color){return '<div class="stat" style="'+theme(color)+'"><span class="stat-icon">'+icon(symbol)+'</span><div><div class="stat-number">'+n+'</div><div class="metric-name">'+label+'</div></div></div>';}
function overview(){
  const open=state.tasks.filter(t=>t.status!=="Done"), due=open.filter(t=>t.due===dayKey()), completed=state.tasks.length-open.length;
  const active=state.projects.filter(p=>progress(p).status!=="Complete").length;
  const date=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  const intro=due.length ? plural(due.length,"task")+' due today. '+plural(active,"active project")+' in your workspace.' : 'Nothing due today. '+plural(open.length,"open task")+' in your workspace.';
  return '<section class="hero"><div class="hero-copy"><div class="date-label">'+icon("sun")+date+'</div><h1>Workspace overview</h1><p>'+intro+'</p></div></section>'+
    '<div class="stats">'+metric(active,"Active projects","folder","moss")+metric(open.length,"Open tasks","tasks","clay")+metric(completed,"Completed tasks","complete","iris")+metric((state.tasks.length?Math.round(completed/state.tasks.length*100):0)+"%","Overall progress","chart","lake")+'</div>'+
    '<section class="section">'+sectionHead("Task focus","tasks","All tasks")+'<div class="task-panel">'+tabs(["Today","Upcoming","Overdue"],focusFilter,"focus")+rows(filtered(open,focusFilter))+'</div></section>';
}
function tabs(names,selected,action){
  return '<div class="filters" role="group" aria-label="Task filters">'+names.map(name=>'<button class="filter '+(name===selected?"active":"")+'" aria-pressed="'+(name===selected)+'" data-action="'+action+'" data-key="'+name+'">'+name+'</button>').join("")+'</div>';
}
function filtered(tasks,filter){
  const today=dayKey();
  return tasks.filter(t=>{
    if(filter==="Completed") return t.status==="Done";
    if(t.status==="Done") return false;
    if(filter==="Today") return t.due===today;
    if(filter==="Upcoming") return !!t.due && t.due>today;
    if(filter==="Overdue") return !!t.due && t.due<today;
    return true;
  }).sort((a,b)=>(a.due||"9999").localeCompare(b.due||"9999") || priorities.indexOf(a.priority)-priorities.indexOf(b.priority) || a.title.localeCompare(b.title));
}
function rows(tasks){
  if (!tasks.length) return '<div class="empty">No tasks in this view. <button class="text-btn" data-action="new-task">Add a task</button></div>';
  return tasks.map(t=>{
    const p=getProject(t.project), done=t.status==="Done", today=dayKey();
    const due=t.due===today?"Today":t.due===relativeDay(1)?"Tomorrow":t.due?new Date(t.due+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",...(t.due.slice(0,4)!==today.slice(0,4)?{year:"numeric"}:{})}):"No date";
    return '<div class="task-row '+(done?"finished":"")+'"><button class="check '+(done?"checked":"")+'" role="checkbox" aria-checked="'+done+'" aria-label="Mark '+esc(t.title)+(done?' open':' complete')+'" data-action="toggle" data-key="'+t.id+'">'+(done?icon("check"):"")+'</button><button class="task-name" data-action="edit-task" data-key="'+t.id+'">'+esc(t.title)+'</button>'+
    (p?'<a class="task-project" style="'+theme(p.color)+'" href="#project/'+p.id+'"><span class="dot"></span><span class="truncate">'+esc(p.name)+'</span></a>':'<span class="task-project">Unassigned</span>')+
    '<span class="priority p-'+t.priority.toLowerCase()+'">'+t.priority+'</span><span class="due '+(!done&&t.due&&t.due<today?"late":"")+'">'+icon("calendar")+due+'</span></div>';
  }).join("");
}
function options(values,selected) {
  return values.map(([key,name])=>'<option value="'+esc(key)+'" '+(key===selected?"selected":"")+'>'+esc(name)+'</option>').join("");
}
function taskResults(project){
  const selected = project?project.id:projectFilter;
  const query = search.toLocaleLowerCase();
  const matches = filtered(state.tasks.filter(task =>
    (selected === "All" || task.project === selected) && task.title.toLocaleLowerCase().includes(query)
  ), taskFilter);
  return '<p class="result-count" role="status">'+plural(matches.length,"task")+'</p>'+rows(matches);
}
function taskPage(project){
  let heading='<div class="section-heading"><h2 id="tasks-title">My tasks</h2></div>';
  if(project){
    const {done,tasks,percent,status}=progress(project);
    heading='<div class="page-heading"><h1>'+esc(project.name)+'</h1><button class="secondary" data-action="edit-project" data-key="'+project.id+'">'+icon("pencil")+'Edit project</button></div><div class="detail" style="'+theme(project.color)+'">'+statusPill(status)+'<div class="card-foot"><p>'+esc(project.description)+'</p><strong>'+percent+'%</strong></div><div class="track"><span style="width:'+percent+'%"></span></div><div class="card-foot">'+done+' of '+plural(tasks.length,"task")+' done</div></div><div class="section-heading"><h2>Project tasks</h2></div>';
  }
  return heading+'<div class="toolbar"><input id="task-search" type="search" placeholder="Search tasks…" aria-label="Search tasks" value="'+esc(search)+'">'+(project?'':'<select id="project-filter" aria-label="Filter by project">'+options([["All","All projects"],["","Unassigned"],...state.projects.map(p=>[p.id,p.name])],projectFilter)+'</select>')+'</div><div class="task-panel">'+tabs(["Open","Today","Upcoming","Overdue","Completed"],taskFilter,"filter")+'<div id="results">'+taskResults(project)+'</div></div>';
}

function openDialog(title,body) {
  dialog.innerHTML='<div class="dialog-inner"><div class="dialog-head"><h2 id="dialog-title">'+esc(title)+'</h2><button class="icon-button" aria-label="Close dialog" data-action="close">'+icon("close")+'</button></div>'+body+'</div>';
  if(!dialog.open) dialog.showModal();
  (dialog.querySelector("[autofocus]") || dialog.querySelector("button")).focus();
}
function field(name,control){return '<label class="field">'+name+control+'</label>';}
function select(name,values,selected){return '<select name="'+name+'">'+options(values,selected)+'</select>';}
function formActions(editing,label){
  return '<div class="dialog-actions">'+(editing?'<button class="delete" type="button" data-action="delete">Delete</button>':'')+'<button type="button" class="secondary" data-action="close">Cancel</button><button class="primary" type="submit">'+label+'</button></div>';
}
function editor(kind,record) {
  const formId=record?.id || "";
  let fields;
  if (kind==="task") {
    fields=field("Task name",'<input name="title" value="'+esc(record?.title||"")+'" required maxlength="240" autofocus>')+
      field("Project",select("project",[["","Unassigned"],...state.projects.map(p=>[p.id,p.name])],record?.project??(route==="project"?projectId:"")))+
      '<div class="form-pair">'+field("Due date",'<input name="due" type="date" value="'+esc(record?.due??(route==="calendar"?dayKey(calendarDate):dayKey()))+'">')+
      field("Time (optional)",'<input name="time" type="time" value="'+esc(record?.time||"")+'">')+'</div>'+
      '<div class="form-pair">'+field("Priority",select("priority",priorities.map(x=>[x,x]),record?.priority||"Medium"))+
      field("Status",select("status",groups.map(x=>[x,x]),record?.status||"To do"))+'</div>';
  } else {
    fields=field("Project name",'<input name="name" value="'+esc(record?.name||"")+'" required maxlength="100" autofocus>')+
      field("Description",'<textarea name="description" maxlength="500">'+esc(record?.description||"")+'</textarea>')+
      '<div class="form-pair">'+field("Color",select("color",Object.entries(palette).map(([k,v])=>[k,v.name]),record?.color||"moss"))+
      field("Icon",select("icon",Object.entries(iconNames),record?.icon||"folder"))+'</div>';
  }
  openDialog((record?"Edit ":"New ")+kind,'<form id="record-form" data-kind="'+kind+'" data-key="'+formId+'"><div class="form-grid">'+fields+'</div>'+formActions(!!record,record?"Save changes":"Create "+kind)+'</form>');
}
function confirmAction(title,body,label,callback){
  openDialog(title,'<p>'+esc(body)+'</p><div class="dialog-actions"><button class="secondary" data-action="close">Cancel</button><button class="danger" id="confirm-action">'+esc(label)+'</button></div>');
  $("#confirm-action").addEventListener("click",callback,{once:true});
}
function openData(){
  const sample=state.projects.some(p=>p.sample)||state.tasks.some(t=>t.sample);
  openDialog("Workspace data",'<div class="data-group"><h3>Browser storage</h3><p>Your projects and tasks are saved in this browser. Export a backup to keep a copy or move your work to another device.</p><div class="actions"><button class="secondary" data-action="export">Export backup</button><button class="secondary" data-action="import">Restore backup</button><input id="backup-file" type="file" accept=".json,application/json" hidden></div><p id="file-error" class="error" role="alert"></p></div>'+
    (sample?'<div class="data-group"><h3>Sample workspace</h3><p>Remove the starter projects and tasks when you’re ready. Your additions and edits are kept.</p><div class="actions"><button class="secondary" data-action="clear-samples">Remove samples</button></div></div>':''));
}
function exportData(){
  const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));
  const link=document.createElement("a");link.href=url;link.download="fieldwork-"+dayKey()+".json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function clearSamples(){
  const tasks=state.tasks.filter(t=>!t.sample);
  const keepIds=new Set(tasks.map(t=>t.project));
  const projects=state.projects.filter(p=>!p.sample || keepIds.has(p.id)).map(p=>({...p,sample:false}));
  if(save({...state,projects,tasks})) {dialog.close();render();notify("Starter data removed");}
}
function removeRecord(){
  const form=$("#record-form"), task=form.dataset.kind==="task", key=form.dataset.key;
  const item=task?getTask(key):getProject(key);
  if(!item) return;
  const detail=task?"Remove this task from your workspace?":"Remove this project? Its tasks will be kept under Unassigned.";
  confirmAction("Delete "+(task?"task":"project"),detail,"Delete",()=>{
    const next=structuredClone(state);
    if(task) next.tasks=next.tasks.filter(t=>t.id!==key);
    else {next.projects=next.projects.filter(p=>p.id!==key);next.tasks=next.tasks.map(t=>t.project===key?{...t,project:"",sample:false}:t);}
    if(save(next)){dialog.close();render();notify(task?"Task deleted":"Project deleted");}
  });
}
function submitRecord(event){
  if(event.target.id!=="record-form") return;
  event.preventDefault();
  const form=event.target, key=form.dataset.key, task=form.dataset.kind==="task";
  const fields=Object.fromEntries(new FormData(form));
  for (const name of Object.keys(fields)) fields[name]=fields[name].trim();
  const name=task?"title":"name";
  if(!fields[name]){form.elements[name].setCustomValidity("Enter a name.");form.elements[name].reportValidity();return;}
  if (task && fields.time && !fields.due) {
    form.elements.due.setCustomValidity("Choose a date for this time.");
    form.elements.due.reportValidity();
    return;
  }
  const collection=task?"tasks":"projects", next=structuredClone(state);
  const record={id:key||id(),...fields,sample:false};
  if(key){
    const index=next[collection].findIndex(x=>x.id===key);
    if(index<0){dialog.close();render();notify("This item was removed in another tab");return;}
    next[collection][index]=record;
  } else next[collection].push(record);
  if(save(next)){
    dialog.close();
    if(!task && !key) location.hash="project/"+record.id;
    render();notify((task?"Task":"Project")+(key?" updated":" created"));
  }
}
function handleAction(event){
  const control=event.target.closest("[data-action]");
  if(!control) return;
  const {action,key}=control.dataset;
  switch(action){
    case "appearance": {
      const next = document.documentElement.dataset.appearance === "dark" ? "light" : "dark";
      applyAppearance(next);
      try { localStorage.setItem(appearanceKey, next); } catch { /* Keep the chosen appearance for this visit. */ }
      break;
    }
    case "rain": {
      const visible = $("#rain").hidden;
      applyRain(visible);
      try { localStorage.setItem(rainKey, visible ? "on" : "off"); } catch { /* Keep this choice for the current visit. */ }
      break;
    }
    case "menu":{
      const open=document.body.classList.toggle("menu-open");$("#scrim").hidden=!open;
      $("#menu-btn").setAttribute("aria-expanded",String(open));if(open) $("#sidebar .brand").focus();else $("#menu-btn").focus();break;
    }
    case "new-task": closeMenu();editor("task");break;
    case "new-project": closeMenu();editor("project");break;
    case "edit-task": editor("task",getTask(key));break;
    case "edit-project": editor("project",getProject(key));break;
    case "toggle":{
      const next=structuredClone(state), item=next.tasks.find(t=>t.id===key);
      if(!item)break;
      item.status=item.status==="Done"?"To do":"Done";item.sample=false;
      if(save(next)){render();notify(item.status==="Done"?"Task completed":"Task reopened");}break;
    }
    case "focus": focusFilter=key;render();break;
    case "filter": taskFilter=key;render();break;
    case "close": dialog.close();break;
    case "delete": removeRecord();break;
    case "data": closeMenu();openData();break;
    case "export": exportData();break;
    case "import": $("#backup-file").click();break;
    case "clear-samples":confirmAction("Remove sample data?","Edited items and projects containing your own tasks will be kept.","Remove samples",clearSamples);break;
  }
}
document.addEventListener("click",handleAction);
$(".skip").addEventListener("click", event => {
  event.preventDefault();
  $(route === "welcome" ? "#welcome-main" : "#main").focus();
});
document.addEventListener("click", event => {
  const link = event.target.closest("a[href]");
  if (!link) return;
  if (link.closest("#sidebar, #welcome-navigation")) closeMenu();
  // Filtered task shortcuts share one section and can be selected again after scrolling.
  if (link.hash.startsWith("#tasks/") && location.hash === link.hash &&
      !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
    event.preventDefault();
    setRoute(true);
    scrollToRoute();
  }
});
document.addEventListener("submit",submitRecord);
document.addEventListener("input",e=>{
  if(e.target.id==="task-search"){search=e.target.value;$("#results").innerHTML=taskResults(route==="project"?getProject(projectId):null);}
  if(e.target.matches("#record-form input"))e.target.setCustomValidity("");
  if(e.target.matches("#record-form [name=time]"))e.target.form.elements.due.setCustomValidity("");
});
document.addEventListener("change",async e=>{
  if(e.target.id==="project-filter"){projectFilter=e.target.value;$("#results").innerHTML=taskResults(null);}
  if(e.target.id==="backup-file" && e.target.files[0]){
    const file=e.target.files[0];e.target.value="";
    try{
      const candidate=validate(JSON.parse(await file.text()));
      confirmAction("Restore workspace?",plural(candidate.projects.length,"project")+" and "+plural(candidate.tasks.length,"task")+" from this backup will replace the current workspace.","Restore backup",()=>{
        if(save(candidate,true)){dialog.close();location.hash="overview";render();notify("Backup restored");}
      });
    }catch{if($("#file-error"))$("#file-error").textContent="This file is not a valid Fieldwork backup. Choose an exported JSON file.";}
  }
});
dialog.addEventListener("click",e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!dialog.open&&document.body.classList.contains("menu-open")){closeMenu();$("#menu-btn").focus();}});
window.addEventListener("hashchange", () => {
  setRoute(true);
  scrollToRoute();
});
window.addEventListener("storage",e=>{
  if (e.key === appearanceKey) { applyAppearance(e.newValue); return; }
  if (e.key === rainKey) { applyRain(e.newValue !== "off"); return; }
  if (e.key === null) applyRain(true);
  if(e.key!==storageKey&&e.key!==null) return;
  if(dialog.open) dialog.close();
  load();setRoute();notify("Workspace updated in another tab");
});
let renderedDay=dayKey();
function refreshDay(){
  if(!document.hidden && dayKey()!==renderedDay){
    if (dayKey(calendarDate) === renderedDay) calendarDate = new Date(dayKey() + "T12:00:00");
    renderedDay=dayKey();render();
  }
}
document.addEventListener("visibilitychange",refreshDay);
setInterval(refreshDay,60000);

document.querySelectorAll("[data-icon]").forEach(el=>el.outerHTML=icon(el.dataset.icon));
window.addEventListener("scroll", syncSectionNavigation, {passive:true});
window.addEventListener("resize", syncSectionNavigation);
let savedAppearance, savedRain;
try {
  savedAppearance = localStorage.getItem(appearanceKey);
  savedRain = localStorage.getItem(rainKey);
} catch { /* Use the default appearance and rain settings. */ }
applyAppearance(savedAppearance);
applyRain(savedRain !== "off");
load();
setRoute();
if (route !== "welcome") scrollToRoute("instant", false);
