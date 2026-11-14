import { test } from "node:test";
import assert from "node:assert/strict";
import { makeBackup, readBackup } from "../src/backup.js";

const state = {
  week: { startedOn: "2026-11-10", items: [], days: [] },
  history: [{ startedOn: "2026-11-03" }, { startedOn: "2026-10-27" }],
  stars: 12,
  owned: { "space-rocket": { shiny: true } },
};

test("a backup can be read back unchanged", () => {
  const back = readBackup(makeBackup(state, "2026-11-13"));
  assert.deepEqual(back.state, state);
  assert.equal(back.savedOn, "2026-11-13");
});

test("files that are not backups are refused", () => {
  for (const text of ["hello", "{}", '{"app":"other","version":1,"state":{"history":[]}}', '{"app":"piano-practice","version":1,"state":{}}']) {
    assert.throws(() => readBackup(text), /isn't a backup/);
  }
});
