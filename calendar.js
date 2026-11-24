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

function calendarMonthDays(date) {
  const first = new Date(date);
  first.setDate(1);
  const last = new Date(first);
  last.setMonth(last.getMonth() + 1, 0);
  const leading = (first.getDay() + 6) % 7;
  return calendarDays(calendarMonday(first), Math.ceil((leading + last.getDate()) / 7) * 7);
}

function spansDays(task) {
  return !!task.startDate && task.startDate < task.due;
}

function calendarTaskDates(dates) {
  const keys = dates.map(date => dayKey(date));
  const byDate = new Map(keys.map(key => [key, []]));
  for (const task of state.tasks) {
    const start = task.startDate || task.due;
    if (!task.due || task.due < keys[0] || start > keys[keys.length - 1]) continue;
    for (const key of keys) {
      if (start <= key && key <= task.due) byDate.get(key).push(task);
    }
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

function calendarEvent(task, projects, compact, position = "", date = task.due) {
  const project = projects.get(task.project);
  const done = task.status === "Done";
  const title = esc(task.title);
  const time = task.time ? calendarTime(task.time) : "";
  const range = task.endTime ? task.time + "–" + (task.endTime === "00:00" ? "24:00" : task.endTime) : task.time || "";
  const projectName = esc(project?.name || "Unassigned");
  const dates = spansDays(task) ? task.startDate + " – " + task.due : "";
  const description = [done ? "Completed" : "", dates, range, title, projectName].filter(Boolean).join(" · ");
  const style = calendarColor(project);
  if (compact) {
    return `<button class="cal-event${position ? " cal-week-block" : ""}${done ? " is-done" : ""}" style="${style};${position}" data-action="edit-task" data-key="${task.id}" title="${description}" aria-label="Edit ${description}">
      ${time ? `<span class="cal-time">${position ? range : time}</span>` : ""}<span class="cal-event-title">${title}</span></button>`;
  }
  const row = position ? "cal-block" : "cal-agenda-row";
  return `<div class="${row}${done ? " is-done" : ""}" style="${style};${position}">
    <button class="check${done ? " checked" : ""}" data-action="toggle" data-key="${task.id}" role="checkbox" aria-checked="${done}" aria-label="Mark ${title} ${done ? "open" : "complete"}">${done ? icon("check") : ""}</button>
    <button class="cal-agenda-task" data-action="edit-task" data-key="${task.id}" aria-label="Edit ${description}" title="${description}">
      ${time ? `<time class="cal-agenda-time" datetime="${date}T${task.time}">${range}</time>` : ""}
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

function calendarTimeAxis(blocks, weekly) {
  let first = calendarFullDay ? 0 : 8 * 60, last = calendarFullDay ? 1440 : 18 * 60;
  const ends = new Map();
  const ticks = new Set();
  for (const block of blocks) {
    first = Math.min(first, Math.floor(block.start / 60) * 60);
    last = Math.max(last, Math.ceil(block.end / 60) * 60);
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
    height += (minute - previous) * (weekly ? 1.3 : 1.8);
    for (const start of ends.get(minute) || []) height = Math.max(height, y.get(start) + 45);
    y.set(minute, height);
    previous = minute;
  }
  return {first, last, y, height};
}

function calendarLanes(day, axis, projects, weekly) {
  const {first, last, y, height} = axis;
  const slots = [];
  for (let minute = first; minute < last; minute += 30) {
    const value = clockLabel(minute), top = y.get(minute);
    slots.push(`<button class="cal-slot${minute % 60 ? " half-hour" : ""}" style="top:${top}px;height:${y.get(minute + 30) - top}px" data-action="new-task" data-date="${day.key}" data-time="${value}" aria-label="Add a task on ${day.key} at ${value}"><span aria-hidden="true">+ ${value}</span></button>`);
  }
  const bookings = day.blocks.map(({task, start, end, lane, group}) => {
    const height = y.get(end) - y.get(start);
    const lines = Math.max(1, Math.floor((height - 24) / 16));
    const style = `top:${y.get(start)}px;height:${height}px;left:${100 * lane / group.columns}%;width:${100 / group.columns}%;--title-lines:${lines}`;
    return calendarEvent(task, projects, weekly, style, day.key);
  }).join("");
  return `<div class="cal-lanes" data-day="${day.key}" style="height:${height}px">${slots.join("")}${bookings}</div>`;
}

function calendarTimetable(dates, byDate, projects) {
  const weekly = dates.length > 1;
  const days = dates.map(date => {
    const key = dayKey(date), tasks = byDate.get(key);
    const blocks = calendarDayBlocks(tasks.filter(t => t.time));
    const lanes = blocks.reduce((max, block) => Math.max(max, block.group.columns), 1);
    return {date, key, tasks, blocks, lanes};
  });
  const blocks = days.flatMap(day => day.blocks);
  const axis = calendarTimeAxis(blocks, weekly);
  const labels = [];
  for (let minute = axis.first; minute <= axis.last; minute += 60) {
    labels.push(`<span style="top:${axis.y.get(minute)}px">${clockLabel(minute)}</span>`);
  }
  const minimum = weekly ? "var(--week-lane)" : "124px";
  const tracks = days.map(day => `minmax(calc(${day.lanes} * ${minimum}),1fr)`).join(" ");
  const headers = weekly ? '<div class="cal-week-corner"></div>' + days.map(day =>
    `<div class="cal-week-date">${calendarDayButton(day.date)}</div>`).join("") : "";
  const showAllDay = weekly && days.some(day => day.tasks.some(task => !task.time));
  const allDay = showAllDay ? '<div class="cal-week-all-label">All-day</div>' + days.map(day =>
    `<div class="cal-week-all" data-day="${day.key}">${day.tasks.filter(t => !t.time).map(t => calendarEvent(t, projects, true)).join("")}</div>`).join("") : "";
  return `<section class="cal-schedule${weekly ? " cal-week-schedule" : ""}" aria-labelledby="schedule-heading">
    <div class="cal-schedule-heading"><h3 id="schedule-heading">${weekly ? 'Week timetable <small lang="zh-Hans">周课表</small>' : 'Timetable <small lang="zh-Hans">日课表</small>'}</h3>
    <button data-cal="hours" aria-pressed="${calendarFullDay}">24 hours</button></div>
    ${blocks.length ? "" : '<p class="cal-slot-hint">点空白时段安排任务 · Select a time slot to add a task.</p>'}
    <div class="cal-lanes-viewport" tabindex="0" role="region" aria-label="${weekly ? "Weekly" : "Daily"} timetable">
      <div class="cal-timetable" style="grid-template-columns:47px ${tracks}">${headers}${allDay}
      <div class="cal-ruler" aria-hidden="true">${labels.join("")}</div>${days.map(day => calendarLanes(day, axis, projects, weekly)).join("")}</div></div></section>`;
}

function calendarDayView(week, byDate, projects) {
  const tasks = byDate.get(dayKey(calendarDate));
  const allDay = tasks.filter(t => !t.time);
  const open = tasks.filter(item => item.status !== "Done").length;
  return `<nav class="cal-strip" aria-label="Days of this week">${week.map(date => calendarDayButton(date)).join("")}</nav>
    <div class="cal-agenda"><div class="cal-agenda-heading"><h2>${calendarFormats.dayHeading.format(calendarDate)}</h2>
    <span>${open} open · ${tasks.length - open} done</span></div>
    ${allDay.length ? `<section class="cal-group"><h3>All-day · 全天</h3><div class="cal-all-day">${allDay.map(t => calendarEvent(t, projects, false)).join("")}</div></section>` : ""}
    ${calendarTimetable([calendarDate], byDate, projects)}</div>`;
}

// Pack each week's visible slices into rows. One button spans all occupied columns.
function calendarMonthWeek(dates, byDate, projects, month) {
  const keys = dates.map(date => dayKey(date));
  const ranges = [...new Set(keys.flatMap(key => byDate.get(key).filter(spansDays)))];
  ranges.sort((a,b) => a.startDate.localeCompare(b.startDate) || b.due.localeCompare(a.due) || a.id.localeCompare(b.id));
  const rowEnds = [];
  const bars = ranges.map(task => {
    const first = Math.max(0, keys.indexOf(task.startDate));
    const last = task.due >= keys[6] ? 6 : keys.indexOf(task.due);
    let row = rowEnds.findIndex(end => end < first);
    if (row < 0) row = rowEnds.length;
    rowEnds[row] = last;
    const before = task.startDate < keys[0], after = task.due > keys[6];
    const label = esc(task.title) + " · " + task.startDate + " – " + task.due;
    return `<button class="cal-event cal-span${task.status === "Done" ? " is-done" : ""}${before ? " from-prior" : ""}${after ? " to-next" : ""}" data-key="${task.id}" data-action="edit-task" title="${label}" aria-label="Edit ${label}"
      style="${calendarColor(projects.get(task.project))};grid-column:${first + 1} / span ${last - first + 1};grid-row:${row + 1}"><span class="cal-event-title">${before ? "‹ " : ""}${esc(task.title)}${after ? " ›" : ""}</span></button>`;
  }).join("");
  const cells = dates.map((date,i) => {
    const key = keys[i], tasks = byDate.get(key), singles = tasks.filter(t => !spansDays(t));
    const more = singles.length - 3;
    const dots = singles.slice(0,3).map(t => `<i style="${calendarColor(projects.get(t.project))}"></i>`).join("");
    return `<div class="cal-cell${date.getMonth() !== month ? " is-outside" : ""}${i > 4 ? " is-weekend" : ""}">
      ${calendarDayButton(date, false, `<span class="cal-dots" aria-hidden="true">${dots}</span>`, tasks.length)}
      ${singles.slice(0,3).map(t => calendarEvent(t, projects, true)).join("")}
      ${more > 0 ? `<button class="cal-more" data-cal="date" data-value="${key}" aria-label="Show all tasks on ${calendarFormats.fullDate.format(date)}">+${more} more</button>` : ""}</div>`;
  }).join("");
  return `<div class="cal-month-week" data-day="${keys[0]}" style="--span-rows:${rowEnds.length}">${cells}<div class="cal-span-grid">${bars}</div></div>`;
}

function calendarMonthView(dates, byDate, projects) {
  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) weeks.push(calendarMonthWeek(dates.slice(i,i + 7), byDate, projects, calendarDate.getMonth()));
  const monthDates = dates.filter(date => date.getMonth() === calendarDate.getMonth());
  const first = dayKey(monthDates[0]);
  const agenda = monthDates.map(date => {
    const key = dayKey(date);
    const tasks = byDate.get(key).filter(t => !spansDays(t) || key === first || t.startDate === key);
    if (!tasks.length) return "";
    return `<section><h3><button data-cal="date" data-value="${key}">${calendarFormats.dayHeading.format(date)}</button></h3>
      ${tasks.map(t => calendarEvent(t, projects, true)).join("")}</section>`;
  }).join("");
  return `<div class="cal-month-labels" aria-hidden="true">${dates.slice(0,7).map(d => `<span>${calendarFormats.weekday.format(d)}</span>`).join("")}</div>
    <div class="cal-month-grid">${weeks.join("")}</div><div class="cal-month-agenda">${agenda || '<p>No tasks scheduled this month.</p>'}</div>`;
}

function calendarPage() {
  const week = calendarDays(calendarMonday(calendarDate), 7);
  const dates = calendarView === "month" ? calendarMonthDays(calendarDate) : week;
  const byDate = calendarTaskDates(dates);
  const projects = new Map(state.projects.map(p => [p.id, p]));
  let period = calendarFormats.month.format(calendarDate);
  if (calendarView === "week" && week[0].getMonth() !== week[6].getMonth()) {
    const start = week[0].getFullYear() === week[6].getFullYear() ? calendarFormats.shortMonth : calendarFormats.month;
    period = start.format(week[0]) + " – " + calendarFormats.month.format(week[6]);
  }
  const modes = [["day", "Day", "日"], ["week", "Week", "周"], ["month", "Month", "月"]];
  const body = calendarView === "month" ? calendarMonthView(dates, byDate, projects) :
    calendarView === "week" ? calendarTimetable(week, byDate, projects) :
    calendarDayView(week, byDate, projects);
  return `<section id="calendar" data-view="${calendarView}" class="workspace-section" tabindex="-1" aria-labelledby="calendar-title">
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
  const oldLeft = document.querySelector("#calendar .cal-lanes-viewport")?.scrollLeft || 0;
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
  if (calendarView === "week") {
    const viewport = document.querySelector(".cal-lanes-viewport");
    viewport.scrollLeft = oldLeft;
    if (cal === "view" || cal === "today") {
      const dateBox = viewport.querySelector(".cal-date.is-selected").getBoundingClientRect();
      const bounds = viewport.getBoundingClientRect();
      const axisWidth = viewport.querySelector(".cal-ruler").offsetWidth;
      if (dateBox.left < bounds.left + axisWidth || dateBox.right > bounds.right) {
        viewport.scrollLeft += dateBox.left - bounds.left - axisWidth;
      }
    }
  }
  const selector = `#calendar [data-cal="${cal}"]` + (value ? `[data-value="${value}"]` : "");
  document.querySelector(selector)?.focus({preventScroll:true});
  if (cal === "date" && document.getElementById("calendar").getBoundingClientRect().top < document.querySelector(".welcome-header").offsetHeight) {
    document.getElementById("calendar").scrollIntoView({block:"start"});
  }
});
