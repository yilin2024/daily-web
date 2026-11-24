"use strict";

let calendarView = "day";
let calendarFullDay = false;
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

function clockMinutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function clockLabel(minutes) {
  return String(Math.floor(minutes / 60)).padStart(2, "0") + ":" + String(minutes % 60).padStart(2, "0");
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

function calendarColor(project) {
  return project ? `--accent:var(--cal-${project.color},${palette[project.color].accent})` : "--accent:var(--cal-unassigned,var(--faint))";
}

function calendarEvent(task, projects, compact, position = "") {
  const project = projects.get(task.project);
  const done = task.status === "Done";
  const title = esc(task.title);
  const time = task.time ? calendarTime(task.time) : "";
  const range = task.endTime ? task.time + "–" + (task.endTime === "00:00" ? "24:00" : task.endTime) : task.time || "";
  const projectName = esc(project?.name || "Unassigned");
  const description = [done ? "Completed" : "", range, title, projectName].filter(Boolean).join(" · ");
  const style = calendarColor(project);
  if (compact) {
    return `<button class="cal-event${done ? " is-done" : ""}" style="${style}" data-action="edit-task" data-key="${task.id}" title="${description}" aria-label="Edit ${description}">
      ${time ? `<span class="cal-time">${time}</span>` : ""}<span class="cal-event-title">${title}</span></button>`;
  }
  const row = position ? "cal-block" : "cal-agenda-row";
  return `<div class="${row}${done ? " is-done" : ""}" style="${style};${position}">
    <button class="check${done ? " checked" : ""}" data-action="toggle" data-key="${task.id}" role="checkbox" aria-checked="${done}" aria-label="Mark ${title} ${done ? "open" : "complete"}">${done ? icon("check") : ""}</button>
    <button class="cal-agenda-task" data-action="edit-task" data-key="${task.id}" aria-label="Edit ${description}" title="${description}">
      ${time ? `<time class="cal-agenda-time" datetime="${task.due}T${task.time}">${range}</time>` : ""}
      <span class="cal-task-title">${title}</span>${position ? "" : `<span class="cal-project"><i class="dot"></i>${projectName}</span>`}
    </button></div>`;
}

function calendarDayButton(date, showWeekday = true, markers = "", count = 0) {
  const key = dayKey(date);
  const selected = key === dayKey(calendarDate);
  const today = key === dayKey();
  const taskCount = count ? ", " + plural(count, "task") : "";
  return `<button class="cal-date${selected ? " is-selected" : ""}${today ? " is-today" : ""}" data-cal="date" data-value="${key}" aria-label="${calendarFormats.fullDate.format(date)}${today ? ", today" : ""}${taskCount}"${today ? ' aria-current="date"' : ""}>
    ${showWeekday ? `<span class="cal-weekday">${calendarFormats.weekday.format(date)}</span>` : ""}<span class="cal-number">${date.getDate()}</span>${markers}</button>`;
}

// Tasks arrive in start-time order. Only tasks in the same overlapping group share columns.
function calendarDayBlocks(tasks) {
  const blocks = [];
  let group, groupEnd = 0, laneEnds = [];
  for (const task of tasks) {
    const start = clockMinutes(task.time);
    const end = task.endTime ? (clockMinutes(task.endTime) || 1440) : start + 1;
    if (!group || start >= groupEnd) {
      group = {columns: 0};
      groupEnd = end;
      laneEnds = [];
    }
    let lane = laneEnds.findIndex(freeAt => freeAt <= start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = end;
    group.columns = laneEnds.length;
    groupEnd = Math.max(groupEnd, end);
    blocks.push({task, start, end, lane, group});
  }
  return blocks;
}

function calendarTimetable(tasks, projects) {
  const blocks = calendarDayBlocks(tasks);
  let first = calendarFullDay ? 0 : 8 * 60, last = calendarFullDay ? 1440 : 18 * 60;
  let columns = 1;
  const ends = new Map();
  const ticks = new Set();
  for (const block of blocks) {
    first = Math.min(first, Math.floor(block.start / 60) * 60);
    last = Math.max(last, Math.ceil(block.end / 60) * 60);
    columns = Math.max(columns, block.group.columns);
    ticks.add(block.start);
    ticks.add(block.end);
    if (!ends.has(block.end)) ends.set(block.end, []);
    ends.get(block.end).push(block.start);
  }
  for (let minute = first; minute <= last; minute += 30) ticks.add(minute);
  // Keep even a one-minute booking readable. Stretch its interval and shift later labels with it.
  const y = new Map();
  let previous = first, height = 0;
  for (const minute of [...ticks].sort((a, b) => a - b)) {
    height += (minute - previous) * 1.4;
    for (const start of ends.get(minute) || []) height = Math.max(height, y.get(start) + 45);
    y.set(minute, height);
    previous = minute;
  }
  const labels = [], slots = [];
  for (let minute = first; minute <= last; minute += 30) {
    const value = clockLabel(minute), top = y.get(minute);
    if (minute % 60 === 0) labels.push(`<span style="top:${top}px">${value}</span>`);
    if (minute === last) break;
    const slotHeight = y.get(minute + 30) - top;
    slots.push(`<button class="cal-slot${minute % 60 ? " half-hour" : ""}" style="top:${top}px;height:${slotHeight}px" data-action="new-task" data-time="${value}" aria-label="Add a task at ${value}">
      <span aria-hidden="true">+ ${value}</span></button>`);
  }
  const bookings = blocks.map(({task, start, end, lane, group}) => {
    const style = `top:${y.get(start)}px;height:${y.get(end) - y.get(start)}px;left:${100 * lane / group.columns}%;width:${100 / group.columns}%`;
    return calendarEvent(task, projects, false, style);
  }).join("");
  return `<section class="cal-schedule" aria-labelledby="schedule-heading">
    <div class="cal-schedule-heading"><h3 id="schedule-heading">Timetable <small lang="zh-Hans">日课表</small></h3>
    <button data-cal="hours" aria-pressed="${calendarFullDay}">24 hours</button></div>
    ${tasks.length ? "" : '<p class="cal-slot-hint">点空白时段安排任务 · Select a time slot to add a task.</p>'}
    <div class="cal-timetable"><div class="cal-ruler" aria-hidden="true">${labels.join("")}</div>
    <div class="cal-lanes-viewport"><div class="cal-lanes" style="height:${height}px;--columns:${columns}">${slots.join("")}${bookings}</div></div></div></section>`;
}

function calendarDayView(week, tasks, projects) {
  const allDay = tasks.filter(t => !t.time);
  const open = tasks.filter(item => item.status !== "Done").length;
  return `<nav class="cal-strip" aria-label="Days of this week">${week.map(date => calendarDayButton(date)).join("")}</nav>
    <div class="cal-agenda"><div class="cal-agenda-heading"><h2>${calendarFormats.dayHeading.format(calendarDate)}</h2>
    <span>${open} open · ${tasks.length - open} done</span></div>
    ${allDay.length ? `<section class="cal-group"><h3>All-day · 全天</h3><div class="cal-all-day">${allDay.map(t => calendarEvent(t, projects, false)).join("")}</div></section>` : ""}
    ${calendarTimetable(tasks.filter(t => t.time), projects)}</div>`;
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
        return `<i style="${calendarColor(project)}"></i>`;
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
  return `<section id="calendar" class="workspace-section" tabindex="-1" aria-labelledby="calendar-title">
    <div class="section-heading"><h2 id="calendar-title">Calendar <small lang="zh-Hans">日历</small></h2>
      <button class="secondary" data-action="new-task">${icon("plus")}New task</button></div>
    <div class="cal-toolbar"><h3 class="cal-period" aria-live="polite">${period}</h3>
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
  if (cal === "hours") calendarFullDay = !calendarFullDay;
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
