import type { PetScreenSnapshot } from '@/game/rendering/viewModels'

type StatusIslandProps = {
  snapshot: PetScreenSnapshot
  notice?: string | null
}

export function StatusIsland({ snapshot, notice = null }: StatusIslandProps) {
  const statusLabel = notice ?? getStatusLabel(snapshot)
  const isMuted = snapshot.stage === 'dead'

  return (
    <header
      className={`status-island${isMuted ? ' status-island--muted' : ''}`}
    >
      <div className='status-island__group'>
        <span className='status-island__dot' aria-hidden='true' />
        <span className='status-island__value'>
          {formatStage(snapshot.stage)}
        </span>
        <span className='status-island__meta'>{formatMood(snapshot.mood)}</span>
      </div>
      <strong className='status-island__status'>{statusLabel}</strong>
      <div className='status-island__group status-island__group--end'>
        <span className='status-island__meta'>{snapshot.ageLabel}</span>
        <span className='status-island__value'>
          {snapshot.sleepState === 'sleeping' ? '睡眠' : '清醒'}
        </span>
      </div>
    </header>
  )
}

function getStatusLabel(snapshot: PetScreenSnapshot) {
  if (snapshot.stage === 'dead') return '离线'
  if (snapshot.sleepState === 'sleeping') return '休息中'
  if (snapshot.sickness !== 'none') return '需要用药'
  if (snapshot.poopCount > 2) return '需要打扫'
  if (snapshot.stats.hunger > 70) return '饥饿'
  if (snapshot.stats.happiness < 35) return '无聊'
  return '稳定'
}

function formatStage(stage: string) {
  const labels: Record<string, string> = {
    egg: '蛋',
    baby: '幼年',
    child: '童年',
    teen: '少年',
    adult: '成年',
    elder: '长者',
    dead: '死亡',
  }
  return labels[stage] ?? stage
}

function formatMood(mood: string) {
  const labels: Record<string, string> = {
    idle: '平静',
    happy: '开心',
    sad: '难过',
    angry: '生气',
    sick: '生病',
    sleepy: '困倦',
    sleeping: '睡着',
    proud: '骄傲',
    curious: '好奇',
  }
  return labels[mood] ?? mood
}
