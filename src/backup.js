// Backup: everything the app has saved, packed into one file a grown-up
// can keep somewhere safe, and unpacked again on this or another device.
// The functions here only build and check the file's text; app.js does
// the saving and sharing.

const APP = "piano-practice";

// `photos` is { photoId: "data:image/jpeg;base64,..." }.
export function makeBackup(state, photos, savedOn) {
  return JSON.stringify({ app: APP, version: 1, savedOn, state, photos });
}

// Every photo id the saved data refers to.
export function photoIdsIn(state) {
  const ids = [];
  if (state.week && state.week.photoId) ids.push(state.week.photoId);
  for (const past of state.history || []) if (past.photoId) ids.push(past.photoId);
  return ids;
}

// Checks that a file's text is one of our backups. Returns
// { state, photos, savedOn }, or throws an Error with a message to show.
export function readBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't a backup from this app.");
  }
  const ok = data && data.app === APP && data.version === 1 &&
    data.state && typeof data.state === "object" && Array.isArray(data.state.history);
  if (!ok) throw new Error("That file isn't a backup from this app.");
  return { state: data.state, photos: data.photos || {}, savedOn: data.savedOn || "" };
}
