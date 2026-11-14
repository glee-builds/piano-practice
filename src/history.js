// Past weeks and the week streak. Nothing here touches the page.
//
// When a new week starts, the old one is kept as a short summary:
// { startedOn, days, goal, met, holiday, items: ["C major scale", ...] }

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
    holiday: Boolean(week.holiday),
    items: week.items.map((item) => item.text),
  };
}

// How many weeks in a row reached the goal, counting back from now.
// The current week counts once it reaches its goal, and never breaks the
// streak while it is still in progress. A holiday week is skipped: it
// neither adds to the streak nor ends it.
export function weekStreak(history, currentWeek, goal) {
  const counts = currentWeek && !currentWeek.holiday && finishedDayCount(currentWeek) >= goal;
  let streak = counts ? 1 : 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const past = history[i];
    if (past.holiday) continue;
    if (!past.met) break;
    streak++;
  }
  return streak;
}

// Totals across every week so far, for the home screen.
export function totals(history, currentWeek, goal) {
  const now = currentWeek ? finishedDayCount(currentWeek) : 0;
  return {
    practiceDays: history.reduce((sum, past) => sum + past.days, 0) + now,
    goalsReached: history.filter((past) => past.met).length + (currentWeek && now >= goal ? 1 : 0),
  };
}

// The last few weeks, oldest first, ending with the current week, for the
// "Your weeks" picture on the home screen. `inStreak` marks the weeks that
// make up the current streak, using the same rules as weekStreak.
export function recentWeeks(history, currentWeek, goal, count) {
  const weeks = history.map((past) => ({
    startedOn: past.startedOn, days: past.days, met: past.met,
    holiday: Boolean(past.holiday), current: false, inStreak: false,
  }));
  if (currentWeek) {
    const days = finishedDayCount(currentWeek);
    weeks.push({
      startedOn: currentWeek.startedOn, days, met: days >= goal,
      holiday: Boolean(currentWeek.holiday), current: true, inStreak: false,
    });
  }
  for (let i = weeks.length - 1; i >= 0; i--) {
    const week = weeks[i];
    if (week.holiday) continue;
    if (week.met) week.inStreak = true;
    else if (!week.current) break;
  }
  return weeks.slice(-count);
}
