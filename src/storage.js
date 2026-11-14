// Saves and loads everything in the browser's localStorage on this device.
// Nothing here sends data anywhere.

// The key keeps the project's first name on purpose. Changing it would
// hide everything already saved on a device.
const KEY = "piano-practice-v1";

const EMPTY = { week: null, lastItems: [], stars: 0, owned: {}, history: [], goal: 3, prize: null };

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
