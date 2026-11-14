import { test } from "node:test";
import assert from "node:assert/strict";
import { newWeek, startDay, finishDay } from "../src/week.js";
import { shortDate, summarize, dayLog, weekStreak } from "../src/history.js";

function weekWithDays(count) {
  let week = newWeek(["Scale"], "2026-11-10");
  for (let i = 1; i <= count; i++) {
    week = finishDay(startDay(week, `2026-11-1${i}`), `2026-11-1${i}`);
  }
  return week;
}
const met = { met: true, holiday: false };
const missed = { met: false, holiday: false };
const holiday = { met: false, holiday: true };

test("shortDate", () => {
  assert.equal(shortDate("2026-11-03"), "Nov 3");
});

test("summarize records whether the goal was reached", () => {
  assert.deepEqual(summarize(weekWithDays(2), 3), {
    startedOn: "2026-11-10", days: 2, goal: 3, met: false, holiday: false, items: ["Scale"],
    log: [
      { date: "2026-11-11", checked: 0, of: 1, stars: 0 },
      { date: "2026-11-12", checked: 0, of: 1, stars: 0 },
    ],
  });
  assert.equal(summarize(weekWithDays(3), 3).met, true);
});

test("streak counts back through weeks that reached the goal", () => {
  assert.equal(weekStreak([missed, met, met], null, 3), 2);
  assert.equal(weekStreak([met, met, missed], null, 3), 0);
});

test("the current week adds one once its goal is reached, and never breaks the streak", () => {
  assert.equal(weekStreak([met, met], weekWithDays(3), 3), 3);
  assert.equal(weekStreak([met, met], weekWithDays(1), 3), 2);
});

test("a holiday week is skipped", () => {
  assert.equal(weekStreak([met, holiday, met], null, 3), 2);
});

test("a current week marked as a holiday does not add to the streak", () => {
  assert.equal(weekStreak([met], { ...weekWithDays(3), holiday: true }, 3), 1);
});

import { totals, recentWeeks } from "../src/history.js";

test("totals add up practice days and goals reached, including this week", () => {
  const history = [{ days: 3, met: true }, { days: 1, met: false }];
  assert.deepEqual(totals(history, weekWithDays(3), 3), { practiceDays: 7, goalsReached: 2 });
  assert.deepEqual(totals(history, null, 3), { practiceDays: 4, goalsReached: 1 });
});

test("recentWeeks ends with the current week and marks the weeks in the streak", () => {
  const history = [
    { startedOn: "2026-10-06", days: 1, met: false, holiday: false },
    { startedOn: "2026-10-13", days: 3, met: true, holiday: false },
    { startedOn: "2026-10-20", days: 0, met: false, holiday: true },
    { startedOn: "2026-10-27", days: 4, met: true, holiday: false },
  ];
  const weeks = recentWeeks(history, weekWithDays(1), 3, 8);
  assert.deepEqual(weeks.map((w) => w.inStreak), [false, true, false, true, false]);
  assert.equal(weeks[4].current, true);
  assert.equal(weeks.filter((w) => w.inStreak).length, weekStreak(history, weekWithDays(1), 3));
  assert.equal(recentWeeks(history, weekWithDays(3), 3, 2).length, 2);
});

test("the day log lists finished practices only, oldest first", () => {
  let week = newWeek(["Scale", "Piece"], "2026-11-10");
  week = startDay(week, "2026-11-12");
  week = { ...week, days: [{ date: "2026-11-12", done: [1, 2], finished: true, stars: 4 }] };
  week = startDay(week, "2026-11-11");
  week = { ...week, days: week.days.map((day) => (day.date === "2026-11-11" ? { ...day, done: [1], finished: true, stars: 1 } : day)) };
  week = startDay(week, "2026-11-13"); // started, not finished
  assert.deepEqual(dayLog(week), [
    { date: "2026-11-11", checked: 1, of: 2, stars: 1 },
    { date: "2026-11-12", checked: 2, of: 2, stars: 4 },
  ]);
});
