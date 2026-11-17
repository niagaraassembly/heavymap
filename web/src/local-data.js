/* HeavyMap's device-only Save store. The IndexedDB boundary stays small:
 * typed stores are independently exportable and clearable, and records never
 * leave this browser unless the viewer downloads an export. */

export const DATABASE_NAME = "heavymap-local-data";
export const DATABASE_VERSION = 1;
export const LEGACY_NOTES_KEY = "heavymap-parcel-notes-v1";

export const DATA_TYPES = [
  { id: "notes", label: "Parcel notes", description: "Notes attached to parcel records", live: true },
  { id: "saved", label: "Saved places", description: "Parcels and items you keep", live: false },
  { id: "lists", label: "Lists", description: "Groups you make from saved items", live: false },
  { id: "observations", label: "Observations", description: "Your own findings and context", live: false },
  { id: "documents", label: "Documents and images", description: "Documents you create in HeavyMap", live: false },
];

let databasePromise;

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  });
}

async function migrateLegacyNotes(db) {
  let raw;
  try {
    raw = localStorage.getItem(LEGACY_NOTES_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  let notes;
  try {
    const parsed = JSON.parse(raw);
    notes = parsed?.version === 1 && Array.isArray(parsed.notes)
      ? parsed.notes.filter((note) =>
          note &&
          typeof note.id === "string" &&
          typeof note.key === "string" &&
          typeof note.releaseId === "string" &&
          typeof note.text === "string" &&
          typeof note.at === "string",
        )
      : null;
  } catch {
    notes = null;
  }
  // Keep malformed legacy content intact for manual recovery.
  if (!notes) return;

  const transaction = db.transaction("notes", "readwrite");
  const store = transaction.objectStore("notes");
  for (const note of notes) store.put(note);
  await transactionDone(transaction);
  // Delete only after the IndexedDB write committed successfully.
  try {
    localStorage.removeItem(LEGACY_NOTES_KEY);
  } catch {
    // The successfully copied legacy key is harmless and can be removed later.
  }
}

export function openLocalData() {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) {
        reject(new Error("IndexedDB is not available in this browser."));
        return;
      }
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const type of DATA_TYPES) {
          if (!db.objectStoreNames.contains(type.id))
            db.createObjectStore(type.id, { keyPath: "id" });
        }
      };
      request.onsuccess = async () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        try {
          await migrateLegacyNotes(db);
          resolve(db);
        } catch (error) {
          db.close();
          reject(error);
        }
      };
      request.onerror = () => reject(request.error ?? new Error("Could not open local storage."));
      request.onblocked = () => reject(new Error("Close other HeavyMap tabs to finish opening local storage."));
    }).catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

export async function recordsFor(type) {
  const db = await openLocalData();
  const transaction = db.transaction(type, "readonly");
  const result = await requestResult(transaction.objectStore(type).getAll());
  await transactionDone(transaction);
  return result;
}

export async function dataCounts() {
  const db = await openLocalData();
  return Promise.all(DATA_TYPES.map(async (type) => {
    if (!type.live) return { ...type, count: 0 };
    const transaction = db.transaction(type.id, "readonly");
    const count = await requestResult(transaction.objectStore(type.id).count());
    await transactionDone(transaction);
    return { ...type, count };
  }));
}

export async function clearDataType(type) {
  const db = await openLocalData();
  const transaction = db.transaction(type, "readwrite");
  transaction.objectStore(type).clear();
  await transactionDone(transaction);
}

export async function clearAllData() {
  const db = await openLocalData();
  const transaction = db.transaction(DATA_TYPES.map((type) => type.id), "readwrite");
  for (const type of DATA_TYPES) transaction.objectStore(type.id).clear();
  await transactionDone(transaction);
}

export async function exportDataType(type) {
  const definition = DATA_TYPES.find((entry) => entry.id === type);
  if (!definition) throw new Error("Unknown local data type.");
  return {
    format: "heavymap-local-data-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    type,
    label: definition.label,
    records: await recordsFor(type),
  };
}

export async function addNote(note) {
  const db = await openLocalData();
  const transaction = db.transaction("notes", "readwrite");
  transaction.objectStore("notes").put(note);
  await transactionDone(transaction);
  return note;
}

export async function removeNote(id) {
  const db = await openLocalData();
  const transaction = db.transaction("notes", "readwrite");
  transaction.objectStore("notes").delete(id);
  await transactionDone(transaction);
}

export async function createNotesStore() {
  await openLocalData();
  return {
    available: true,
    async notesFor(key) {
      return (await recordsFor("notes"))
        .filter((note) => note.key === key)
        .sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
    },
    add: addNote,
    remove: removeNote,
  };
}
