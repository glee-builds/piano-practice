// Saves and loads everything in the browser's localStorage on this device.
// Nothing here sends data anywhere.

const KEY = "piano-practice-v1";

const EMPTY = { week: null, lastItems: [] };

export function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return saved ? { ...EMPTY, ...saved } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

export function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}
