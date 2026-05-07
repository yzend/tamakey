import { useState } from 'react'

import type { GameState, PetStage } from '../../game/domain/gameTypes'
import { useGameStore } from '../../game/store/useGameStore'
import { useRuntimeStore } from '../../game/store/useRuntimeStore'

import {
  applyTestPatch,
  TEST_PET_STAT_LABELS,
  TEST_RESOURCE_LABELS,
  type TestPetStatKey,
  type TestResourceKey,
} from './patchers'
import {
  createTestScenarioState,
  TEST_SCENARIOS,
  type TestScenarioId,
} from './scenarios'

const TIME_JUMPS = [
  { label: '+5 秒', value: 5_000 },
  { label: '+30 分钟', value: 30 * 60_000 },
  { label: '+1 天', value: 24 * 60 * 60_000 },
  { label: '+7 天', value: 7 * 24 * 60 * 60_000 },
]

const STAGE_OPTIONS: PetStage[] = [
  'egg',
  'baby',
  'child',
  'teen',
  'adult',
  'elder',
  'dead',
]

const STAGE_LABELS: Record<PetStage, string> = {
  adult: '成年',
  baby: '幼年',
  child: '童年',
  dead: '死亡',
  egg: '蛋',
  elder: '长者',
  teen: '少年',
}

const PET_STAT_KEYS = Object.keys(TEST_PET_STAT_LABELS) as TestPetStatKey[]
const RESOURCE_KEYS = Object.keys(TEST_RESOURCE_LABELS) as TestResourceKey[]

export function TestKitPanel() {
  const snapshot = useGameStore((state) => state.snapshot)
  const workerClient = useRuntimeStore((state) => state.workerClient)
  const workerReady = useRuntimeStore((state) => state.workerReady)
  const [open, setOpen] = useState(false)
  const disabled = !snapshot || !workerClient || !workerReady

  const importState = (state: GameState) => {
    workerClient?.post({
      type: 'IMPORT_STATE',
      state,
      now: getNow(),
    })
  }

  const loadScenario = (scenarioId: TestScenarioId) => {
    const now = getNow()
    importState(createTestScenarioState(scenarioId, now, snapshot))
  }

  const applyPatch = (
    patch: Parameters<typeof applyTestPatch>[1],
    state = snapshot
  ) => {
    if (!state) return
    importState(applyTestPatch(state, patch))
  }

  const jumpTime = (durationMs: number) => {
    const base = Math.max(getNow(), snapshot?.lastTickAt ?? 0)
    workerClient?.post({ type: 'TICK', now: base + durationMs })
  }

  const completeActivity = () => {
    const endsAt = snapshot?.world.activity?.endsAt
    if (!endsAt) return
    workerClient?.post({ type: 'TICK', now: endsAt + 1 })
  }

  return (
    <aside
      className={`testkit ${open ? 'testkit--open' : ''}`}
      data-testid='testkit-panel'
      aria-label='TestKit 金手指'
    >
      <button
        className='testkit__toggle'
        type='button'
        onClick={() => setOpen((value) => !value)}
      >
        TestKit
      </button>

      {open ? (
        <div className='testkit__body'>
          <header className='testkit__header'>
            <strong>TestKit</strong>
            <span>{disabled ? '等待运行时' : '已连接'}</span>
          </header>

          <section className='testkit__section'>
            <h2>场景</h2>
            <div className='testkit__grid testkit__grid--scenarios'>
              {TEST_SCENARIOS.map((scenario) => (
                <button
                  data-testid={`testkit-scenario-${scenario.id}`}
                  disabled={disabled}
                  key={scenario.id}
                  type='button'
                  onClick={() => loadScenario(scenario.id)}
                >
                  {scenario.label}
                </button>
              ))}
            </div>
          </section>

          <section className='testkit__section'>
            <h2>宠物</h2>
            <label className='testkit__field'>
              <span>阶段</span>
              <select
                disabled={disabled}
                value={snapshot?.pet.stage ?? 'egg'}
                onChange={(event) =>
                  applyPatch({
                    type: 'pet-stage',
                    stage: event.currentTarget.value as PetStage,
                    now: getNow(),
                  })
                }
              >
                {STAGE_OPTIONS.map((stage) => (
                  <option key={stage} value={stage}>
                    {STAGE_LABELS[stage]}
                  </option>
                ))}
              </select>
            </label>

            {PET_STAT_KEYS.map((key) => (
              <label className='testkit__field' key={key}>
                <span>
                  {TEST_PET_STAT_LABELS[key]}
                  <b>{snapshot?.pet[key] ?? 0}</b>
                </span>
                <input
                  disabled={disabled}
                  max='100'
                  min='0'
                  type='range'
                  value={snapshot?.pet[key] ?? 0}
                  onChange={(event) =>
                    applyPatch({
                      type: 'pet-stat',
                      key,
                      value: Number(event.currentTarget.value),
                    })
                  }
                />
              </label>
            ))}

            <div className='testkit__pair'>
              <label className='testkit__field'>
                <span>生病</span>
                <select
                  disabled={disabled}
                  value={snapshot?.pet.sickness ?? 'none'}
                  onChange={(event) =>
                    applyPatch({
                      type: 'sickness',
                      value: event.currentTarget
                        .value as GameState['pet']['sickness'],
                    })
                  }
                >
                  <option value='none'>无</option>
                  <option value='mild'>轻症</option>
                  <option value='severe'>重症</option>
                </select>
              </label>
              <label className='testkit__field'>
                <span>睡眠</span>
                <select
                  disabled={disabled}
                  value={snapshot?.pet.sleepState ?? 'awake'}
                  onChange={(event) =>
                    applyPatch({
                      type: 'sleep',
                      value: event.currentTarget
                        .value as GameState['pet']['sleepState'],
                    })
                  }
                >
                  <option value='awake'>醒着</option>
                  <option value='sleeping'>睡觉</option>
                </select>
              </label>
            </div>

            <label className='testkit__field'>
              <span>
                便便
                <b>{snapshot?.world.poopCount ?? 0}</b>
              </span>
              <input
                disabled={disabled}
                max='5'
                min='0'
                type='range'
                value={snapshot?.world.poopCount ?? 0}
                onChange={(event) =>
                  applyPatch({
                    type: 'poop',
                    value: Number(event.currentTarget.value),
                  })
                }
              />
            </label>
          </section>

          <section className='testkit__section'>
            <h2>资源</h2>
            <div className='testkit__grid'>
              {RESOURCE_KEYS.map((key) => (
                <label className='testkit__field' key={key}>
                  <span>{TEST_RESOURCE_LABELS[key]}</span>
                  <input
                    disabled={disabled}
                    min='0'
                    type='number'
                    value={getResourceValue(snapshot, key)}
                    onChange={(event) =>
                      applyPatch({
                        type: 'resource',
                        key,
                        value: Number(event.currentTarget.value),
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </section>

          <section className='testkit__section'>
            <h2>功能</h2>
            <div className='testkit__flags'>
              {(['social', 'onlineHub', 'mods'] as const).map((key) => (
                <label className='testkit__check' key={key}>
                  <input
                    checked={snapshot?.featureFlags[key] ?? false}
                    disabled={disabled}
                    type='checkbox'
                    onChange={(event) =>
                      applyPatch({
                        type: 'feature',
                        key,
                        value: event.currentTarget.checked,
                      })
                    }
                  />
                  <span>{key}</span>
                </label>
              ))}
            </div>
          </section>

          <section className='testkit__section'>
            <h2>时间</h2>
            <div className='testkit__grid'>
              {TIME_JUMPS.map((jump) => (
                <button
                  disabled={disabled}
                  key={jump.label}
                  type='button'
                  onClick={() => jumpTime(jump.value)}
                >
                  {jump.label}
                </button>
              ))}
              <button
                data-testid='testkit-complete-activity'
                disabled={disabled || !snapshot?.world.activity}
                type='button'
                onClick={completeActivity}
              >
                活动立即完成
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </aside>
  )
}

function getResourceValue(
  state: GameState | null,
  key: TestResourceKey
): number {
  if (!state) return 0
  if (key === 'coins' || key === 'medicine') return state.resources[key]
  if (key === 'food')
    return getInventoryQuantity(state.resources.food, 'basic-meal')
  return getInventoryQuantity(state.resources.seeds, 'sprout-seed')
}

function getInventoryQuantity(
  items: GameState['resources']['food'],
  id: string
) {
  return items.find((item) => item.id === id)?.quantity ?? 0
}

function getNow() {
  return Date.now()
}
