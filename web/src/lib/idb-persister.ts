import { openDB, type IDBPDatabase } from 'idb';
import type { PersistedClient, Persister } from '@tanstack/query-persist-client-core';

const DB_NAME = 'ffxiv-is-it-worth-cache';
const STORE = 'query-cache';
const KEY = 'tanstack-query';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE);
      },
    });
  }
  return dbPromise;
}

export function createIDBPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      const db = await getDB();
      await db.put(STORE, client, KEY);
    },
    restoreClient: async () => {
      const db = await getDB();
      return (await db.get(STORE, KEY)) as PersistedClient | undefined;
    },
    removeClient: async () => {
      const db = await getDB();
      await db.delete(STORE, KEY);
    },
  };
}
