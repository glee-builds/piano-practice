// Past weeks and the week streak. Nothing here touches the page.
//
// When a new week starts, the old one is kept as a short summary:
// { startedOn, days, goal, met, holiday, items: ["C major scale", ...], photoId }

import { finishedDayCount } from "./week.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-11-13" -> "Nov 13"
export function shortDate(dateStr) {
  const [, month, day] = dateStr.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}`;
}

export function summarize(week, goal) {
  const days = finishedDayCount(week);
  return {
    startedOn: week.startedOn,
    days,
    goal,
    met: days >= goal,
    holiday: false,
    items: week.items.map((item) => item.text),
    photoId: week.photoId || null,
  };
}

// How many weeks in a row reached the goal, counting back from now.
// The current week counts once it reaches its goal, and never breaks the
// streak while it is still in progress. A holiday week is skipped: it
// neither adds to the streak nor ends it.
export function weekStreak(history, currentWeek, goal) {
  let streak = currentWeek && finishedDayCount(currentWeek) >= goal ? 1 : 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const past = history[i];
    if (past.holiday) continue;
    if (!past.met) break;
    streak++;
  }
  return streak;
}
