import { test } from "node:test";
import assert from "node:assert/strict";
import { newWeek, startDay, toggleItem } from "../src/week.js";
import {
  starsForDay, awardFinish, unopenedGifts, pickSticker, openGift,
  BONUS_STARS, ALBUM_FULL_STARS,
} from "../src/rewards.js";
import { SETS, ALL_STICKERS } from "../data/stickers.js";

const first = () => 0; // a "random" that always picks the first choice

function weekWith(checksPerDay) {
  let week = newWeek(["Scale", "Piece", "Theory"], "2026-11-10");
  checksPerDay.forEach((ids, i) => {
    const date = `2026-11-1${i + 1}`;
    week = startDay(week, date);
    for (const id of ids) week = toggleItem(week, date, id);
  });
  return week;
}

test("one star per checked item, plus a bonus for checking everything", () => {
  assert.equal(starsForDay({ done: [1, 2] }, 3), 2);
  assert.equal(starsForDay({ done: [1, 2, 3] }, 3), 3 + BONUS_STARS);
});

test("a partial practice still earns a small gift", () => {
  const result = awardFinish(weekWith([[1]]), "2026-11-11", 0, 3);
  assert.equal(result.stars, 1);
  assert.deepEqual(result.week.days[0].gifts, [{ kind: "small", stickerId: null }]);
});

test("checking everything earns a big gift", () => {
  const result = awardFinish(weekWith([[1, 2, 3]]), "2026-11-11", 10, 3);
  assert.equal(result.stars, 10 + 3 + BONUS_STARS);
  assert.equal(result.week.days[0].gifts[0].kind, "big");
});

test("finishing again after changing checks fixes the stars and gives no second gift", () => {
  let week = weekWith([[1]]);
  let result = awardFinish(week, "2026-11-11", 0, 3);
  week = toggleItem(result.week, "2026-11-11", 2);
  result = awardFinish(week, "2026-11-11", result.stars, 3);
  assert.equal(result.stars, 2);
  assert.equal(result.week.days[0].gifts.length, 1);
});

test("the practice that reaches the goal adds one golden gift, only once a week", () => {
  let week = weekWith([[1], [1], [1], [1]]);
  let stars = 0;
  for (const date of ["2026-11-11", "2026-11-12"]) {
    ({ week, stars } = awardFinish(week, date, stars, 3));
  }
  assert.equal(unopenedGifts(week).filter((g) => g.kind === "golden").length, 0);
  ({ week, stars } = awardFinish(week, "2026-11-13", stars, 3));
  assert.deepEqual(week.days[2].gifts.map((g) => g.kind), ["small", "golden"]);
  ({ week, stars } = awardFinish(week, "2026-11-14", stars, 3));
  assert.deepEqual(week.days[3].gifts.map((g) => g.kind), ["small"]);
});

test("a gift never holds a sticker the player already has", () => {
  const owned = { [ALL_STICKERS[0].id]: { shiny: false } };
  assert.equal(pickSticker(owned, ALL_STICKERS, first).id, ALL_STICKERS[1].id);
});

test("opening a gift adds the sticker; big gifts are shiny, small ones are not", () => {
  let { week } = awardFinish(weekWith([[1, 2, 3], [1]]), "2026-11-11", 0, 3);
  ({ week } = awardFinish(week, "2026-11-12", 0, 3));
  let result = openGift(week, {}, 0, "2026-11-11", 0, ALL_STICKERS, first);
  assert.equal(result.owned[ALL_STICKERS[0].id].shiny, true);
  result = openGift(result.week, result.owned, 0, "2026-11-12", 0, ALL_STICKERS, first);
  assert.equal(result.owned[ALL_STICKERS[1].id].shiny, false);
  assert.equal(unopenedGifts(result.week).length, 0);
});

test("when the album is full a gift gives bonus stars instead", () => {
  const owned = Object.fromEntries(ALL_STICKERS.map((s) => [s.id, { shiny: false }]));
  const { week } = awardFinish(weekWith([[1]]), "2026-11-11", 0, 3);
  const result = openGift(week, owned, 7, "2026-11-11", 0, ALL_STICKERS, first);
  assert.equal(result.inside.sticker, null);
  assert.equal(result.stars, 7 + ALBUM_FULL_STARS);
  assert.equal(unopenedGifts(result.week).length, 0);
});

test("sticker data: every set has ten stickers, with unique ids and names", () => {
  for (const set of SETS) assert.equal(set.stickers.length, 10, set.name);
  assert.equal(new Set(ALL_STICKERS.map((s) => s.id)).size, ALL_STICKERS.length);
  assert.equal(new Set(ALL_STICKERS.map((s) => s.name)).size, ALL_STICKERS.length);
  for (const s of ALL_STICKERS) assert.ok(s.name && s.art.startsWith("<"), s.id);
});
