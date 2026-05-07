import { validateSaveData, type SaveData } from './saveSchema'

export function migrateSave(save: SaveData): SaveData {
  return validateSaveData(save)
}
