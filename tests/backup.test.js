import { test } from "node:test";
import assert from "node:assert/strict";
import { makeBackup, readBackup, photoIdsIn } from "../src/backup.js";

const state = {
  week: { startedOn: "2026-11-10", items: [], days: [], photoId: "note-2" },
  history: [{ startedOn: "2026-11-03", photoId: "note-1" }, { startedOn: "2026-10-27", photoId: null }],
  stars: 12,
  owned: { "space-rocket": { shiny: true } },
};

test("a backup can be read back unchanged", () => {
  const photos = { "note-1": "data:image/jpeg;base64,AAAA" };
  const back = readBackup(makeBackup(state, photos, "2026-11-13"));
  assert.deepEqual(back.state, state);
  assert.deepEqual(back.photos, photos);
  assert.equal(back.savedOn, "2026-11-13");
});

test("photoIdsIn finds this week's photo and past weeks' photos", () => {
  assert.deepEqual(photoIdsIn(state), ["note-2", "note-1"]);
  assert.deepEqual(photoIdsIn({ week: null, history: [] }), []);
});

test("files that are not backups are refused", () => {
  for (const text of ["hello", "{}", '{"app":"other","version":1,"state":{"history":[]}}', '{"app":"piano-practice","version":1,"state":{}}']) {
    assert.throws(() => readBackup(text), /isn't a backup/);
  }
});
