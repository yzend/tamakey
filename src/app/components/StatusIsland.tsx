import type { PetScreenSnapshot } from '@/game/rendering/viewModels'

type StatusIslandProps = {
  snapshot: PetScreenSnapshot
  notice?: string | null
}

export function StatusIsland({ snapshot, notice = null }: StatusIslandProps) {
  const statusLabel = notice
    ? summarizeNotice(notice)
    : getStatusLabel(snapshot)
  const isMuted = snapshot.stage === 'dead'

  return (
    <header
      className={`status-island${isMuted ? ' status-island--muted' : ''}`}
    >
      <div className='status-island__group'>
        <span className='status-island__dot' aria-hidden='true' />
        <span className='status-island__value'>{snapshot.petName}</span>
        <span className='status-island__value'>
          {formatStage(snapshot.stage)}
        </span>
        <span className='status-island__meta'>{formatMood(snapshot.mood)}</span>
      </div>
      <strong className='status-island__status' title={notice ?? undefined}>
        {statusLabel}
      </strong>
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
  if (snapshot.stage === 'dead') return '再见'
  if (snapshot.sleepState === 'sleeping') return '做梦中'
  if (snapshot.sickness !== 'none') return '要吃药'
  if (snapshot.poopCount > 2) return '要打扫'
  if (snapshot.stats.hunger > 70) return '肚子空'
  if (snapshot.stats.happiness < 35) return '想玩'
  return '心情不错'
}

function summarizeNotice(notice: string) {
  if (notice.includes('无法使用离线缓存') || notice.includes('设置失败')) {
    return '缓存受限'
  }
  if (notice.includes('离线')) return '离线归来'
  if (notice.includes('等待')) return '等待中'
  if (notice.includes('生病') || notice.includes('健康')) return '需要照护'
  if (notice.includes('成长')) return '长大一点'
  return notice
}

function formatStage(stage: string) {
  const labels: Record<string, string> = {
    egg: '蛋',
    baby: '幼体',
    child: '小孩',
    teen: '青春',
    adult: '大人',
    elder: '长辈',
    dead: '离开',
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
