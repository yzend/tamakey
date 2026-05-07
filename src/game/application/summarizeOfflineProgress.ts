import type { GameState, OfflineSummary } from '../domain/gameTypes'

export function summarizeOfflineProgress(
  before: GameState,
  after: GameState,
  elapsedMs: number,
  simulatedMs: number
): OfflineSummary {
  const messages: string[] = []

  if (simulatedMs === 0) {
    messages.push('没有经过离线时间。')
  }
  if (elapsedMs > simulatedMs) {
    messages.push('离线推进已被限制。')
  }
  if (after.pet.stage !== before.pet.stage) {
    messages.push(
      after.pet.stage === 'dead'
        ? 'Tamakey 没能撑过离线时间。'
        : `Tamakey 从${formatStageLabel(before.pet.stage)}成长为${formatStageLabel(after.pet.stage)}。`
    )
  }
  if (after.world.poopCount > before.world.poopCount) {
    messages.push('离线期间房间变脏了。')
  }
  if (after.pet.hunger > before.pet.hunger) {
    messages.push('离线期间 Tamakey 更饿了。')
  }
  if (after.pet.sickness !== before.pet.sickness) {
    messages.push(
      after.pet.sickness === 'none'
        ? '离线期间 Tamakey 康复了。'
        : '离线期间 Tamakey 生病了。'
    )
  }
  if (after.pet.health < before.pet.health) {
    messages.push('离线期间 Tamakey 的健康下降了。')
  }
  if (messages.length === 0 && simulatedMs > 0) {
    messages.push('离线期间 Tamakey 一直在等待。')
  }

  return {
    elapsedMs,
    simulatedMs,
    messages,
  }
}

function formatStageLabel(stage: GameState['pet']['stage']) {
  const labels: Record<GameState['pet']['stage'], string> = {
    adult: '成年',
    baby: '幼年',
    child: '童年',
    dead: '死亡',
    egg: '蛋',
    elder: '长者',
    teen: '少年',
  }
  return labels[stage]
}
