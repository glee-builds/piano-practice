// Keeps photos of the teacher's note on this device, in the browser's
// IndexedDB (a small database built into the browser). Photos are too big
// for localStorage. Nothing here sends a photo anywhere.

const DB_NAME = "piano-practice-photos";
const STORE = "photos";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const savePhoto = (id, blob) => run("readwrite", (store) => store.put(blob, id));
export const loadPhoto = (id) => run("readonly", (store) => store.get(id));
export const deletePhoto = (id) => run("readwrite", (store) => store.delete(id));
export const allPhotoIds = () => run("readonly", (store) => store.getAllKeys());

// Makes a camera photo smaller before saving it, so a year of notes
// doesn't fill up the device. The longest side becomes at most `maxSide`.
export async function shrinkPhoto(file, maxSide = 1600) {
  const picture = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(picture.width, picture.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(picture.width * scale);
  canvas.height = Math.round(picture.height * scale);
  canvas.getContext("2d").drawImage(picture, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("no photo"))), "image/jpeg", 0.8);
  });
}
