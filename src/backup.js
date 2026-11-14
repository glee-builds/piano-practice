// Backup: everything the app has saved, packed into one file a grown-up
// can keep somewhere safe, and unpacked again on this or another device.
// The functions here only build and check the file's text; app.js does
// the saving and sharing.

// Keeps the project's first name on purpose, so older backup files still load.
const APP = "piano-practice";

export function makeBackup(state, savedOn) {
  return JSON.stringify({ app: APP, version: 1, savedOn, state });
}

// Checks that a file's text is one of our backups. Returns
// { state, savedOn }, or throws an Error with a message to show.
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
  return { state: data.state, savedOn: data.savedOn || "" };
}
