import type { ResourceItem, StatItem } from '../gameScreenUi'
import { StatMeter } from './StatMeter'

type StatsPanelProps = {
  resources: ResourceItem[]
  stats: StatItem[]
  className?: string
}

export function StatsPanel({
  resources,
  stats,
  className = 'pet-dashboard',
}: StatsPanelProps) {
  return (
    <div className={className}>
      <div className='resource-strip' aria-label='宠物资源'>
        {resources.map((resource) => (
          <span
            aria-label={`${resource.label} ${resource.value}`}
            className='resource-strip__item'
            key={resource.label}
          >
            <span className='resource-strip__emoji' aria-hidden='true'>
              {resource.emoji}
            </span>
            <span className='resource-strip__text'>{resource.value}</span>
          </span>
        ))}
      </div>
      <div className='stat-grid'>
        {stats.map((stat) => (
          <StatMeter
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            tone={stat.tone}
            value={stat.value}
          />
        ))}
      </div>
    </div>
  )
}
