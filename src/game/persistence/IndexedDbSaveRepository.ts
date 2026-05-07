import { LEGACY_SAVE_KEYS, SAVE_BACKUP_KEY, SAVE_KEY } from './saveKeys'
import type { LoadSaveResult, SaveRepository } from './SaveRepository'
import { validateSaveData, type SaveData } from './saveSchema'

const DB_NAME = 'tamakey-save-db'
const DB_VERSION = 1
const STORE_NAME = 'saves'

export class IndexedDbSaveRepository implements SaveRepository {
  async load(): Promise<LoadSaveResult> {
    try {
      const db = await openDatabase()
      const raw = await getFirstValue(db, [SAVE_KEY, ...LEGACY_SAVE_KEYS])
      db.close()

      if (!raw) return { status: 'empty', data: null }

      try {
        return { status: 'ok', data: validateSaveData(JSON.parse(raw)) }
      } catch (error) {
        await this.backupCorruptSave(raw)
        return { status: 'corrupt', data: null, raw, error }
      }
    } catch (error) {
      globalThis.console.warn('IndexedDB save load failed', error)
      return { status: 'corrupt', data: null, raw: null, error }
    }
  }

  async save(data: SaveData): Promise<void> {
    const db = await openDatabase()
    await setValue(db, SAVE_KEY, JSON.stringify(data))
    db.close()
  }

  async backupCorruptSave(raw: string): Promise<void> {
    const db = await openDatabase()
    await setValue(db, SAVE_BACKUP_KEY, raw)
    db.close()
  }

  async clear(): Promise<void> {
    const db = await openDatabase()
    await deleteValue(db, SAVE_KEY)
    db.close()
  }
}

async function getFirstValue(
  db: IDBDatabase,
  keys: readonly string[]
): Promise<string | null> {
  for (const key of keys) {
    const value = await getValue(db, key)
    if (value) return value
  }

  return null
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('IndexedDB is not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function getValue(db: IDBDatabase, key: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, 'readonly')
      .objectStore(STORE_NAME)
      .get(key)
    request.onsuccess = () =>
      resolve(typeof request.result === 'string' ? request.result : null)
    request.onerror = () => reject(request.error)
  })
}

function setValue(db: IDBDatabase, key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, 'readwrite')
      .objectStore(STORE_NAME)
      .put(value, key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

function deleteValue(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, 'readwrite')
      .objectStore(STORE_NAME)
      .delete(key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
