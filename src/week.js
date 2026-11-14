// The rules for a practice week. Nothing in this file touches the page,
// so every function can be tested with `node --test`.
//
// A week looks like this:
// {
//   startedOn: "2026-11-13",
//   items: [{ id: 1, text: "C major scale" }],
//   days:  [{ date: "2026-11-13", done: [1], finished: false }]
// }

export const DEFAULT_GOAL = 3;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Turns a Date into "YYYY-MM-DD" using the device's own time zone.
export function dateString(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// "2026-11-13" -> "Fri"
export function dayName(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return DAY_NAMES[new Date(year, month - 1, day).getDay()];
}

// Splits what was typed, spoken, or pasted into one item per line.
// Leading list marks such as "1.", "2)", "-", or "•" are removed.
export function parseList(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(\d+\s*[.):]|[-*•–])\s*/, "").trim())
    .filter((line) => line.length > 0);
}

export function newWeek(texts, today) {
  return {
    startedOn: today,
    items: texts.map((text, index) => ({ id: index + 1, text })),
    days: [],
  };
}

// Changes the list part-way through a week. An item whose words are
// unchanged keeps its checkmarks; removed items lose theirs.
export function replaceItems(week, texts) {
  let nextId = Math.max(0, ...week.items.map((item) => item.id)) + 1;
  const unused = [...week.items];
  const items = texts.map((text) => {
    const found = unused.findIndex((item) => item.text === text);
    if (found >= 0) return unused.splice(found, 1)[0];
    return { id: nextId++, text };
  });
  const kept = new Set(items.map((item) => item.id));
  const days = week.days.map((day) => ({
    ...day,
    done: day.done.filter((id) => kept.has(id)),
  }));
  return { ...week, items, days };
}

export function findDay(week, date) {
  return week.days.find((day) => day.date === date) || null;
}

// Adds a practice day for this date, unless there already is one.
export function startDay(week, date) {
  if (findDay(week, date)) return week;
  return { ...week, days: [...week.days, { date, done: [], finished: false }] };
}

// Checks an item for that day, or unchecks it if it was already checked.
export function toggleItem(week, date, itemId) {
  const days = week.days.map((day) => {
    if (day.date !== date) return day;
    const done = day.done.includes(itemId)
      ? day.done.filter((id) => id !== itemId)
      : [...day.done, itemId];
    return { ...day, done };
  });
  return { ...week, days };
}

export function finishDay(week, date) {
  const days = week.days.map((day) =>
    day.date === date ? { ...day, finished: true } : day
  );
  return { ...week, days };
}

export function finishedDayCount(week) {
  return week.days.filter((day) => day.finished).length;
}

export function goalMet(week, goal = DEFAULT_GOAL) {
  return finishedDayCount(week) >= goal;
}
