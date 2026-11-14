import { test } from "node:test";
import assert from "node:assert/strict";
import { newWeek, startDay, finishDay } from "../src/week.js";
import { shortDate, summarize, weekStreak } from "../src/history.js";

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
    startedOn: "2026-11-10", days: 2, goal: 3, met: false, holiday: false, items: ["Scale"], photoId: null,
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
