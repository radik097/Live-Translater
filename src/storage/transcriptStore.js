const DB_NAME = 'live_translater';
const STORE_NAME = 'transcripts';
const DB_VERSION = 1;

let memoryEntries = [];
let db = null;

export async function addEntry(entry) {
  const record = { ...entry, ts: entry.ts || Date.now() };
  memoryEntries.push(record);

  try {
    const database = await getDb();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(record);
    await txComplete(tx);
  } catch (err) {
    console.warn('IndexedDB write failed:', err.message);
  }

  return record;
}

export async function getEntries() {
  if (memoryEntries.length > 0) return [...memoryEntries];

  try {
    const database = await getDb();
    const tx = database.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const entries = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    memoryEntries = entries;
    return [...entries];
  } catch (err) {
    console.warn('IndexedDB read failed:', err.message);
    return [];
  }
}

export async function clearEntries() {
  memoryEntries = [];
  try {
    const database = await getDb();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    await txComplete(tx);
  } catch (err) {
    console.warn('IndexedDB clear failed:', err.message);
  }
}

function getDb() {
  if (db) return Promise.resolve(db);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, {
          keyPath: 'ts',
          autoIncrement: false,
        });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function txComplete(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}
