import { LEGACY_SAVE_KEYS, SAVE_BACKUP_KEY, SAVE_KEY } from './saveKeys'
import { validateSaveData, type SaveData } from './saveSchema'
import type { LoadSaveResult, SaveRepository } from './SaveRepository'

export class LocalStorageSaveRepository implements SaveRepository {
  load(): LoadSaveResult {
    let raw: string | null

    try {
      raw =
        localStorage.getItem(SAVE_KEY) ??
        LEGACY_SAVE_KEYS.map((key) => localStorage.getItem(key)).find(
          Boolean
        ) ??
        null
    } catch (error) {
      globalThis.console.warn('读取存档失败', error)
      return { status: 'corrupt', data: null, raw: null, error }
    }

    if (!raw) return { status: 'empty', data: null }

    try {
      return { status: 'ok', data: validateSaveData(JSON.parse(raw)) }
    } catch (error) {
      globalThis.console.warn('解析或校验存档失败', error)
      this.backupCorruptSave(raw)
      return { status: 'corrupt', data: null, raw, error }
    }
  }

  save(data: SaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    } catch (error) {
      globalThis.console.warn('写入存档失败', error)
    }
  }

  backupCorruptSave(raw: string): void {
    try {
      localStorage.setItem(SAVE_BACKUP_KEY, raw)
    } catch (error) {
      globalThis.console.warn('备份损坏存档失败', error)
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(SAVE_KEY)
    } catch (error) {
      globalThis.console.warn('清除存档失败', error)
    }
  }
}
