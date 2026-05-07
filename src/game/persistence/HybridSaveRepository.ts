import { IndexedDbSaveRepository } from './IndexedDbSaveRepository'
import { LocalStorageSaveRepository } from './LocalStorageSaveRepository'
import type { LoadSaveResult, SaveRepository } from './SaveRepository'
import type { SaveData } from './saveSchema'

export class HybridSaveRepository implements SaveRepository {
  private readonly indexedDb = new IndexedDbSaveRepository()
  private readonly localStorage = new LocalStorageSaveRepository()
  private usingFallback = false

  async load(): Promise<LoadSaveResult> {
    const indexedDbResult = await this.indexedDb.load()
    if (indexedDbResult.status === 'ok') return indexedDbResult

    if (indexedDbResult.status === 'empty') {
      const localStorageResult = this.localStorage.load()
      if (localStorageResult.status === 'ok') {
        void this.indexedDb.save(localStorageResult.data)
      }
      if (localStorageResult.status !== 'empty') return localStorageResult

      return indexedDbResult
    }

    this.usingFallback = true
    return this.localStorage.load()
  }

  async save(data: SaveData): Promise<void> {
    if (!this.usingFallback) {
      try {
        await this.indexedDb.save(data)
        return
      } catch (error) {
        globalThis.console.warn('Falling back to localStorage saves', error)
        this.usingFallback = true
      }
    }

    this.localStorage.save(data)
  }

  async backupCorruptSave(raw: string): Promise<void> {
    if (this.usingFallback) {
      this.localStorage.backupCorruptSave(raw)
      return
    }

    await this.indexedDb.backupCorruptSave(raw)
  }

  async clear(): Promise<void> {
    await this.indexedDb.clear()
    this.localStorage.clear()
  }
}
