import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dateString, dayName, parseList, newWeek, replaceItems,
  startDay, toggleItem, finishDay, finishedDayCount, goalMet, findDay,
  missedDates, dropEmptyDays,
} from "../src/week.js";

test("dateString uses the local date", () => {
  assert.equal(dateString(new Date(2026, 0, 5)), "2026-01-05");
});

test("dayName gives the short weekday", () => {
  assert.equal(dayName("2026-11-13"), "Fri");
});

test("parseList makes one item per line and drops list marks and blanks", () => {
  const text = "1. C major scale\n2) Minuet, bars 1-8\n\n- Theory p. 14\n• Sight reading\n  ";
  assert.deepEqual(parseList(text), [
    "C major scale", "Minuet, bars 1-8", "Theory p. 14", "Sight reading",
  ]);
});

test("parseList keeps numbers that are part of the item", () => {
  assert.deepEqual(parseList("3 octaves of G major"), ["3 octaves of G major"]);
});

test("a practice day is added once per date", () => {
  let week = newWeek(["Scale", "Piece"], "2026-11-10");
  week = startDay(week, "2026-11-11");
  week = startDay(week, "2026-11-11");
  assert.equal(week.days.length, 1);
});

test("toggleItem checks and unchecks only that day", () => {
  let week = newWeek(["Scale", "Piece"], "2026-11-10");
  week = startDay(startDay(week, "2026-11-11"), "2026-11-12");
  week = toggleItem(week, "2026-11-12", 2);
  assert.deepEqual(findDay(week, "2026-11-11").done, []);
  assert.deepEqual(findDay(week, "2026-11-12").done, [2]);
  week = toggleItem(week, "2026-11-12", 2);
  assert.deepEqual(findDay(week, "2026-11-12").done, []);
});

test("only finished days count toward the goal", () => {
  let week = newWeek(["Scale"], "2026-11-10");
  for (const date of ["2026-11-11", "2026-11-12", "2026-11-13"]) week = startDay(week, date);
  week = finishDay(finishDay(week, "2026-11-11"), "2026-11-12");
  assert.equal(finishedDayCount(week), 2);
  assert.equal(goalMet(week), false);
  week = finishDay(week, "2026-11-13");
  assert.equal(goalMet(week), true);
});

test("changing the list keeps checks for unchanged items and drops removed ones", () => {
  let week = newWeek(["Scale", "Piece"], "2026-11-10");
  week = startDay(week, "2026-11-11");
  week = toggleItem(toggleItem(week, "2026-11-11", 1), "2026-11-11", 2);
  week = replaceItems(week, ["Piece", "Theory"]);
  assert.deepEqual(week.items, [{ id: 2, text: "Piece" }, { id: 3, text: "Theory" }]);
  assert.deepEqual(findDay(week, "2026-11-11").done, [2]);
});

test("a day added later for an earlier date is kept in date order", () => {
  let week = newWeek(["Scale"], "2026-11-10");
  week = startDay(week, "2026-11-13");
  week = startDay(week, "2026-11-11");
  assert.deepEqual(week.days.map((day) => day.date), ["2026-11-11", "2026-11-13"]);
});

test("missed dates run from yesterday back to the start of the week", () => {
  let week = newWeek(["Scale"], "2026-11-10");
  week = startDay(week, "2026-11-12");
  assert.deepEqual(missedDates(week, "2026-11-14"), ["2026-11-13", "2026-11-11", "2026-11-10"]);
  assert.deepEqual(missedDates(week, "2026-11-10"), []);
  assert.deepEqual(missedDates(week, "2026-11-14", 2), ["2026-11-13", "2026-11-11"]);
});

test("missed dates cross a month boundary", () => {
  const week = newWeek(["Scale"], "2026-10-30");
  assert.deepEqual(missedDates(week, "2026-11-02"), ["2026-11-01", "2026-10-31", "2026-10-30"]);
});

test("empty days are dropped, used ones are kept", () => {
  let week = newWeek(["Scale"], "2026-11-10");
  week = finishDay(startDay(week, "2026-11-10"), "2026-11-10");
  week = toggleItem(startDay(week, "2026-11-11"), "2026-11-11", 1);
  week = startDay(week, "2026-11-12");
  assert.deepEqual(dropEmptyDays(week).days.map((day) => day.date), ["2026-11-10", "2026-11-11"]);
});
