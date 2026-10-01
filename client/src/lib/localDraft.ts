const database = "roomstager-drafts";
const maxAge = 24 * 60 * 60 * 1000;
export type RoomDraft = { image: string; mask: string | null; roomType: string; mode: string };
async function open() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(database, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function saveLocal<T>(key: string, value: T | null) {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite");
      const store = tx.objectStore("drafts");
      if (value === null) store.delete(key);
      else store.put({ value, savedAt: Date.now() }, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export async function loadLocal<T>(key: string): Promise<T | null> {
  const db = await open();
  try {
    return await new Promise<T | null>((resolve, reject) => {
      const request = db.transaction("drafts").objectStore("drafts").get(key);
      request.onsuccess = () => {
        const row = request.result;
        resolve(row && Date.now() - row.savedAt < maxAge ? row.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}
