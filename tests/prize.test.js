import { test } from "node:test";
import assert from "node:assert/strict";
import { goldenCount, prizeProgress } from "../src/prize.js";

test("golden gifts are counted from past weeks that reached the goal, plus this week", () => {
  const history = [{ met: true }, { met: false }, { met: true }];
  assert.equal(goldenCount(history, null), 2);
  assert.equal(goldenCount(history, { goldenGiven: true }), 3);
  assert.equal(goldenCount(history, { goldenGiven: false }), 2);
});

test("only golden gifts earned after the prize was set count toward it", () => {
  const prize = { text: "Prize", need: 3, base: 2 };
  assert.deepEqual(prizeProgress(prize, 2), { have: 0, need: 3, earned: false });
  assert.deepEqual(prizeProgress(prize, 4), { have: 2, need: 3, earned: false });
  assert.deepEqual(prizeProgress(prize, 9), { have: 3, need: 3, earned: true });
});
