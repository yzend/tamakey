import type { SaveData } from './saveSchema'

export type LoadSaveResult =
  | { status: 'empty'; data: null }
  | { status: 'ok'; data: SaveData }
  | { status: 'corrupt'; data: null; raw: string | null; error: unknown }

export interface SaveRepository {
  load(): LoadSaveResult | Promise<LoadSaveResult>
  save(data: SaveData): void | Promise<void>
  backupCorruptSave(raw: string): void | Promise<void>
  clear(): void | Promise<void>
}
