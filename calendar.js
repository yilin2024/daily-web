"use strict";

let calendarView = "day";
let calendarDate = new Date();
calendarDate.setHours(12, 0, 0, 0);

const calendarFormats = Object.fromEntries(Object.entries({
  month: {month:"long", year:"numeric"},
  shortMonth: {month:"short"},
  weekday: {weekday:"short"},
  fullDate: {weekday:"long", month:"long", day:"numeric", year:"numeric"},
  dayHeading: {weekday:"long", month:"long", day:"numeric"}
}).map(([name, options]) => [name, new Intl.DateTimeFormat("en-US", options)]));

function calendarOffset(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function calendarMonday(date) {
  return calendarOffset(date, -((date.getDay() + 6) % 7));
}

function calendarDays(start, count) {
  return Array.from({length:count}, (_, index) => calendarOffset(start, index));
}

function calendarMonthStep(date, step) {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + step);
  const end = new Date(next);
  end.setMonth(next.getMonth() + 1, 0);
  next.setDate(Math.min(date.getDate(), end.getDate()));
  return next;
}

function calendarTime(value) {
  const [hour, minute] = value.split(":");
  return (Number(hour) % 12 || 12) + ":" + minute + (Number(hour) < 12 ? " AM" : " PM");
}

function calendarTaskDates() {
  const byDate = new Map();
  for (const task of state.tasks) {
    if (!task.due) continue;
    if (!byDate.has(task.due)) byDate.set(task.due, []);
    byDate.get(task.due).push(task);
  }
  for (const tasks of byDate.values()) {
    tasks.sort((a, b) => (a.time || "").localeCompare(b.time || "") ||
      Number(a.status === "Done") - Number(b.status === "Done") || a.title.localeCompare(b.title));
  }
  return byDate;
}

function calendarEvent(task, projects, compact) {
  const project = projects.get(task.project);
  const done = task.status === "Done";
  const title = esc(task.title);
  const time = task.time ? calendarTime(task.time) : "";
  const projectName = esc(project?.name || "Unassigned");
  const description = [done ? "Completed" : "", time, title, projectName].filter(Boolean).join(" · ");
  const style = project ? theme(project.color) : "--accent:var(--faint)";
  if (compact) {
    return `<button class="cal-event${done ? " is-done" : ""}" style="${style}" data-action="edit-task" data-key="${task.id}" title="${description}" aria-label="Edit ${description}">
      ${time ? `<span class="cal-time">${time}</span>` : ""}<span class="cal-event-title">${title}</span></button>`;
  }
  return `<div class="cal-agenda-row${done ? " is-done" : ""}" style="${style}">
    <button class="check${done ? " checked" : ""}" data-action="toggle" data-key="${task.id}" role="checkbox" aria-checked="${done}" aria-label="Mark ${title} ${done ? "open" : "complete"}">${done ? icon("check") : ""}</button>
    <button class="cal-agenda-task" data-action="edit-task" data-key="${task.id}" aria-label="Edit ${description}">
      <span class="cal-task-title">${title}</span><span class="cal-project"><i class="dot"></i>${projectName}</span>
    </button>${time ? `<time class="cal-agenda-time" datetime="${task.due}T${task.time}">${time}</time>` : ""}</div>`;
}

function calendarDayButton(date, showWeekday = true, markers = "", count = 0) {
  const key = dayKey(date);
  const selected = key === dayKey(calendarDate);
  const today = key === dayKey();
  const taskCount = count ? ", " + plural(count, "task") : "";
  return `<button class="cal-date${selected ? " is-selected" : ""}${today ? " is-today" : ""}" data-cal="date" data-value="${key}" aria-label="${calendarFormats.fullDate.format(date)}${today ? ", today" : ""}${taskCount}"${today ? ' aria-current="date"' : ""}>
    ${showWeekday ? `<span class="cal-weekday">${calendarFormats.weekday.format(date)}</span>` : ""}<span class="cal-number">${date.getDate()}</span>${markers}</button>`;
}

function calendarDayView(week, tasks, projects) {
  const agenda = (label, items) => items.length ? `<section class="cal-group"><h3>${label}</h3>${items.map(t => calendarEvent(t, projects, false)).join("")}</section>` : "";
  const open = tasks.filter(item => item.status !== "Done").length;
  return `<nav class="cal-strip" aria-label="Days of this week">${week.map(date => calendarDayButton(date)).join("")}</nav>
    <div class="cal-agenda"><div class="cal-agenda-heading"><h2>${calendarFormats.dayHeading.format(calendarDate)}</h2>
    <span>${open} open · ${tasks.length - open} done</span></div>
    ${agenda("All-day", tasks.filter(t => !t.time))}${agenda("Scheduled", tasks.filter(t => t.time))}
    ${tasks.length ? "" : '<div class="cal-empty"><p>No tasks scheduled.</p><button class="text-btn" data-action="new-task">Add a task for this day</button></div>'}</div>`;
}

function calendarWeekView(week, byDate, projects) {
  return `<div class="cal-week-grid">${week.map((date, index) => {
    const tasks = byDate.get(dayKey(date)) || [];
    return `<section class="cal-week-column${index > 4 ? " is-weekend" : ""}" aria-label="${calendarFormats.fullDate.format(date)}">
      ${calendarDayButton(date)}<div class="cal-week-events">${tasks.length ? tasks.map(t => calendarEvent(t, projects, true)).join("") : '<span class="cal-week-empty" aria-label="No tasks">—</span>'}</div></section>`;
  }).join("")}</div>`;
}

function calendarMonthView(byDate, projects) {
  const first = new Date(calendarDate);
  first.setDate(1);
  const last = new Date(first);
  last.setMonth(last.getMonth() + 1, 0);
  const leading = (first.getDay() + 6) % 7;
  const dates = calendarDays(calendarMonday(first), Math.ceil((leading + last.getDate()) / 7) * 7);
  const occupied = dates.filter(date => date.getMonth() === first.getMonth() && byDate.has(dayKey(date)));
  const monthAgenda = occupied.map(date => {
    const key = dayKey(date);
    return `<section><h3><button data-cal="date" data-value="${key}">${calendarFormats.dayHeading.format(date)}</button></h3>
      ${byDate.get(key).map(t => calendarEvent(t, projects, true)).join("")}</section>`;
  }).join("");
  return `<div class="cal-month-labels" aria-hidden="true">${dates.slice(0, 7).map(d => `<span>${calendarFormats.weekday.format(d)}</span>`).join("")}</div>
    <div class="cal-month-grid">${dates.map((date, i) => {
      const key = dayKey(date);
      const tasks = byDate.get(key) || [];
      const more = tasks.length - 3;
      const dots = tasks.slice(0, 3).map(t => {
        const project = projects.get(t.project);
        return `<i style="background:${project ? palette[project.color].accent : "var(--faint)"}"></i>`;
      }).join("");
      return `<div class="cal-cell${date.getMonth() !== first.getMonth() ? " is-outside" : ""}${i % 7 > 4 ? " is-weekend" : ""}">
        ${calendarDayButton(date, false, `<span class="cal-dots" aria-hidden="true">${dots}</span>`, tasks.length)}${tasks.slice(0, 3).map(t => calendarEvent(t, projects, true)).join("")}
        ${more > 0 ? `<button class="cal-more" data-cal="date" data-value="${key}" aria-label="Show all ${tasks.length} tasks on ${calendarFormats.fullDate.format(date)}">+${more} more</button>` : ""}</div>`;
    }).join("")}</div><div class="cal-month-agenda">${monthAgenda || '<p>No tasks scheduled this month.</p>'}</div>`;
}

function calendarPage() {
  const week = calendarDays(calendarMonday(calendarDate), 7);
  const byDate = calendarTaskDates();
  const projects = new Map(state.projects.map(p => [p.id, p]));
  let period = calendarFormats.month.format(calendarDate);
  if (calendarView === "week" && week[0].getMonth() !== week[6].getMonth()) {
    const start = week[0].getFullYear() === week[6].getFullYear() ? calendarFormats.shortMonth : calendarFormats.month;
    period = start.format(week[0]) + " – " + calendarFormats.month.format(week[6]);
  }
  const modes = [["day", "Day", "日"], ["week", "Week", "周"], ["month", "Month", "月"]];
  const body = calendarView === "month" ? calendarMonthView(byDate, projects) :
    calendarView === "week" ? calendarWeekView(week, byDate, projects) :
    calendarDayView(week, byDate.get(dayKey(calendarDate)) || [], projects);
  return `<section id="calendar" aria-label="Calendar / 日历">
    <div class="cal-toolbar"><h1 aria-live="polite">${period}</h1>
      <div class="cal-controls"><div class="cal-modes" role="group" aria-label="Calendar view">${modes.map(([key, label, zh]) =>
        `<button data-cal="view" data-value="${key}" aria-pressed="${calendarView === key}">${label} <small lang="zh-Hans">${zh}</small></button>`).join("")}</div>
      <div class="cal-pager" role="group" aria-label="Calendar navigation">
        <button data-cal="prev" aria-label="Previous ${calendarView}"><span aria-hidden="true">‹</span></button>
        <button data-cal="today">Today</button><button data-cal="next" aria-label="Next ${calendarView}"><span aria-hidden="true">›</span></button>
      </div></div></div><div class="cal-sheet">${body}</div></section>`;
}

document.addEventListener("click", event => {
  const hit = event.target.closest("button");
  const button = hit ? hit.closest("#calendar [data-cal]") : event.target.closest("#calendar .cal-cell")?.querySelector(".cal-date");
  if (!button) return;
  const {cal, value} = button.dataset;
  if (cal === "view") calendarView = value;
  if (cal === "date") {
    calendarDate = new Date(value + "T12:00:00");
    calendarView = "day";
  }
  if (cal === "today") calendarDate = new Date(dayKey() + "T12:00:00");
  if (cal === "prev" || cal === "next") {
    const step = cal === "next" ? 1 : -1;
    calendarDate = calendarView === "month" ? calendarMonthStep(calendarDate, step) :
      calendarOffset(calendarDate, step * (calendarView === "week" ? 7 : 1));
  }
  document.getElementById("calendar").outerHTML = calendarPage();
  const selector = `#calendar [data-cal="${cal}"]` + (value ? `[data-value="${value}"]` : "");
  document.querySelector(selector)?.focus({preventScroll:true});
  if (cal === "date" && document.getElementById("calendar").getBoundingClientRect().top < document.querySelector(".welcome-header").offsetHeight) {
    document.getElementById("calendar").scrollIntoView({block:"start"});
  }
});
