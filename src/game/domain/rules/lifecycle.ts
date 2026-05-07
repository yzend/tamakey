import { clamp, clampInteger } from '../../../shared/clamp'
import {
  AWAKE_ENERGY_DECAY_PER_HOUR,
  BLADDER_FILL_PER_HOUR,
  CLEANLINESS_DECAY_PER_HOUR,
  DAILY_MISSION_SECONDS,
  DIRTY_CLEANLINESS_THRESHOLD,
  DIRTY_POOP_THRESHOLD,
  EVOLUTION_THRESHOLDS_SECONDS,
  GARDEN_GROW_SECONDS,
  GARDEN_WITHER_SECONDS,
  HAPPINESS_DECAY_PER_HOUR,
  HEALTH_LOSS_HUNGER_AFTER_SECONDS,
  HUNGER_DECAY_PER_HOUR,
  HUNGER_HEALTH_LOSS_PER_HOUR,
  HUNGRY_THRESHOLD,
  MAX_POOP_COUNT,
  MILD_SICKNESS_AFTER_SECONDS,
  MILD_SICKNESS_HEALTH_LOSS_PER_HOUR,
  NEGLECT_DEATH_AFTER_SECONDS,
  POOP_INTERVAL_SECONDS,
  SEVERE_SICKNESS_AFTER_SECONDS,
  SEVERE_SICKNESS_HEALTH_LOSS_PER_HOUR,
  SLEEPING_ENERGY_GAIN_PER_HOUR,
  STAT_MAX,
  STAT_MIN,
  WANT_DURATION_SECONDS,
} from '../constants'
import type {
  GameEvent,
  GameState,
  InteractionResult,
  MissionId,
  PetMood,
  PetStage,
} from '../gameTypes'

export function incrementAge(
  state: GameState,
  deltaSeconds: number
): GameState {
  // 死亡状态冻结年龄，避免复活或新蛋逻辑受到旧生命周期推进影响。
  if (state.pet.stage === 'dead') return state

  return {
    ...state,
    pet: {
      ...state.pet,
      ageSeconds: state.pet.ageSeconds + deltaSeconds,
    },
  }
}

export function applyNaturalDecay(
  state: GameState,
  deltaSeconds: number
): GameState {
  if (state.pet.stage === 'egg' || state.pet.stage === 'dead') return state

  const hours = deltaSeconds / 3600
  // 寄养和度假只保留轻微消耗，活动中也降低需求变化，避免短活动惩罚过重。
  const protectionMultiplier =
    state.pet.onVacation || state.pet.atParents ? 0.15 : 1
  const activityMultiplier = state.world.activity ? 0.35 : 1
  const needMultiplier = activityMultiplier * protectionMultiplier

  return {
    ...state,
    pet: {
      ...state.pet,
      hunger: clamp(
        state.pet.hunger + HUNGER_DECAY_PER_HOUR * hours * needMultiplier,
        STAT_MIN,
        STAT_MAX
      ),
      happiness: clamp(
        state.pet.happiness - HAPPINESS_DECAY_PER_HOUR * hours * needMultiplier,
        STAT_MIN,
        STAT_MAX
      ),
      cleanliness: clamp(
        state.pet.cleanliness -
          CLEANLINESS_DECAY_PER_HOUR * hours * needMultiplier,
        STAT_MIN,
        STAT_MAX
      ),
      bladder: clamp(
        state.pet.bladder + BLADDER_FILL_PER_HOUR * hours * needMultiplier,
        STAT_MIN,
        STAT_MAX
      ),
    },
  }
}

export function applySleep(state: GameState, deltaSeconds: number): GameState {
  if (state.pet.stage === 'egg' || state.pet.stage === 'dead') return state

  const hours = deltaSeconds / 3600
  // 睡眠只改变体力；饥饿、清洁等仍由自然衰减统一处理。
  const energyDelta =
    state.pet.sleepState === 'sleeping'
      ? SLEEPING_ENERGY_GAIN_PER_HOUR * hours
      : -AWAKE_ENERGY_DECAY_PER_HOUR * hours

  return {
    ...state,
    pet: {
      ...state.pet,
      energy: clamp(state.pet.energy + energyDelta, STAT_MIN, STAT_MAX),
    },
  }
}

export function applyPoopGeneration(
  state: GameState,
  deltaSeconds: number,
  events: GameEvent[],
  now: number
): GameState {
  if (state.pet.stage === 'egg' || state.pet.stage === 'dead') return state

  // 如厕压力满格会立刻生成一次排泄物，消化计时则负责周期性生成。
  const bladderPoop = state.pet.bladder >= 100 ? 1 : 0
  const totalDigestionSeconds = state.world.digestionSeconds + deltaSeconds
  const timedPoop = Math.floor(totalDigestionSeconds / POOP_INTERVAL_SECONDS)
  const poopIncrease = bladderPoop + timedPoop
  const digestionSeconds = totalDigestionSeconds % POOP_INTERVAL_SECONDS
  const poopCount = clampInteger(
    state.world.poopCount + poopIncrease,
    0,
    MAX_POOP_COUNT
  )

  if (poopCount > state.world.poopCount) {
    events.push({ type: 'poopCreated', count: poopCount, at: now })
  }

  return {
    ...state,
    pet: {
      ...state.pet,
      bladder: bladderPoop > 0 ? 0 : state.pet.bladder,
    },
    world: {
      ...state.world,
      poopCount,
      digestionSeconds,
    },
  }
}

export function applyCarePressure(
  state: GameState,
  deltaSeconds: number
): GameState {
  // carePressure 是“连续处于坏状态”的计时器，恢复正常后对应计时清零。
  const neglected =
    state.pet.hunger > HUNGRY_THRESHOLD ||
    state.pet.cleanliness < DIRTY_CLEANLINESS_THRESHOLD ||
    state.pet.sickness !== 'none' ||
    state.world.poopCount >= DIRTY_POOP_THRESHOLD

  return {
    ...state,
    carePressure: {
      hungrySeconds:
        state.pet.hunger > HUNGRY_THRESHOLD
          ? state.carePressure.hungrySeconds + deltaSeconds
          : 0,
      dirtySeconds:
        state.pet.cleanliness < DIRTY_CLEANLINESS_THRESHOLD ||
        state.world.poopCount >= DIRTY_POOP_THRESHOLD
          ? state.carePressure.dirtySeconds + deltaSeconds
          : 0,
      sickSeconds:
        state.pet.sickness !== 'none'
          ? state.carePressure.sickSeconds + deltaSeconds
          : 0,
      neglectSeconds: neglected
        ? state.carePressure.neglectSeconds + deltaSeconds
        : 0,
    },
  }
}

export function applySicknessPressure(
  state: GameState,
  events: GameEvent[],
  now: number
): GameState {
  // 清洁或排泄长期未处理先变轻症，轻症持续未处理再升级为重症。
  if (
    state.pet.sickness === 'none' &&
    state.carePressure.dirtySeconds > MILD_SICKNESS_AFTER_SECONDS
  ) {
    events.push({ type: 'becameSick', sickness: 'mild', at: now })
    return {
      ...state,
      pet: {
        ...state.pet,
        sickness: 'mild',
      },
    }
  }

  if (
    state.pet.sickness === 'mild' &&
    state.carePressure.sickSeconds > SEVERE_SICKNESS_AFTER_SECONDS
  ) {
    events.push({ type: 'becameSick', sickness: 'severe', at: now })
    return {
      ...state,
      pet: {
        ...state.pet,
        sickness: 'severe',
      },
    }
  }

  return state
}

export function applyHealthPressure(
  state: GameState,
  deltaSeconds: number
): GameState {
  if (state.pet.stage === 'egg' || state.pet.stage === 'dead') return state

  const hours = deltaSeconds / 3600
  let healthLoss = 0

  // 健康值来自具体问题扣减，deathSafety 则记录长期忽视导致的死亡缓冲。
  if (state.carePressure.hungrySeconds > HEALTH_LOSS_HUNGER_AFTER_SECONDS) {
    healthLoss += HUNGER_HEALTH_LOSS_PER_HOUR * hours
  }
  if (state.pet.sickness === 'mild') {
    healthLoss += MILD_SICKNESS_HEALTH_LOSS_PER_HOUR * hours
  }
  if (state.pet.sickness === 'severe') {
    healthLoss += SEVERE_SICKNESS_HEALTH_LOSS_PER_HOUR * hours
  }

  const safetyLoss =
    state.carePressure.neglectSeconds > NEGLECT_DEATH_AFTER_SECONDS
      ? 20 * hours
      : 0

  if (healthLoss === 0 && safetyLoss === 0) return state

  return {
    ...state,
    pet: {
      ...state.pet,
      health: clamp(state.pet.health - healthLoss, STAT_MIN, STAT_MAX),
      deathSafety: clamp(
        state.pet.deathSafety - safetyLoss,
        STAT_MIN,
        STAT_MAX
      ),
    },
  }
}

export function applyEvolution(
  state: GameState,
  events: GameEvent[],
  now: number
): GameState {
  if (state.pet.stage === 'dead') return state

  // MVP 阶段的成长只看年龄阈值；复杂照护分支可通过 catalogs.evolutions 扩展。
  const previous = state.pet.stage
  const next = deriveNextStageForMvp(
    state.pet.ageSeconds,
    state.settings.fastHatch
  )

  if (previous === next) return state

  events.push(
    previous === 'egg'
      ? { type: 'hatched', at: now }
      : { type: 'evolved', from: previous, to: next, at: now }
  )

  return {
    ...state,
    pet: {
      ...state.pet,
      stage: next,
      hatchedAt: previous === 'egg' ? now : state.pet.hatchedAt,
    },
    ui: {
      ...state.ui,
      lastToast:
        previous === 'egg'
          ? '宠物孵化了。'
          : `宠物成长为${formatStageLabel(next)}。`,
    },
  }
}

export function deriveNextStageForMvp(
  ageSeconds: number,
  fastHatch = false
): PetStage {
  // fastHatch 只影响蛋阶段，方便测试和新手流程快速进入可交互状态。
  const eggThreshold = fastHatch ? 5 : EVOLUTION_THRESHOLDS_SECONDS.egg
  if (ageSeconds < eggThreshold) return 'egg'
  if (ageSeconds < EVOLUTION_THRESHOLDS_SECONDS.baby) return 'baby'
  if (ageSeconds < EVOLUTION_THRESHOLDS_SECONDS.child) return 'child'
  if (ageSeconds < EVOLUTION_THRESHOLDS_SECONDS.child * 3) return 'teen'
  if (ageSeconds < EVOLUTION_THRESHOLDS_SECONDS.child * 7) return 'adult'
  return 'elder'
}

export function applyDailyMissionReset(
  state: GameState,
  now: number
): GameState {
  if (now < state.missions.resetAt) return state

  // 日常任务按下一次 resetAt 滚动，重置进度但保留任务定义和奖励配置。
  return {
    ...state,
    missions: {
      ...state.missions,
      dailySeed: new Date(now).toISOString().slice(0, 10),
      resetAt: now + DAILY_MISSION_SECONDS * 1000,
      list: state.missions.list.map((mission) => ({
        ...mission,
        progress: 0,
        claimed: false,
      })),
    },
  }
}

export function applyGardenProgress(
  state: GameState,
  events: GameEvent[],
  now: number
): GameState {
  let changed = false
  const plots = state.garden.plots.map((plot) => {
    // 已经设置枯萎时间的作物在过期后保留为 withered，等待玩家清理或覆盖。
    if (plot.cropId && plot.witheredAt !== null && now > plot.witheredAt) {
      changed = true
      events.push({ type: 'gardenUpdated', plotId: plot.id, at: now })
      return {
        ...plot,
        cropId: 'withered',
      }
    }

    if (!plot.cropId || plot.plantedAt === null || plot.readyAt !== null) {
      return plot
    }

    // 未成熟的作物到达成长时间后进入可收获窗口，并同时计算枯萎时间。
    const readyAt = plot.plantedAt + GARDEN_GROW_SECONDS * 1000
    if (now < readyAt) return plot

    changed = true
    events.push({ type: 'gardenUpdated', plotId: plot.id, at: now })
    return {
      ...plot,
      readyAt,
      witheredAt: readyAt + GARDEN_WITHER_SECONDS * 1000,
    }
  })

  return changed ? { ...state, garden: { ...state.garden, plots } } : state
}

export function applyWantAndMisbehavior(
  state: GameState,
  events: GameEvent[],
  now: number
): GameState {
  if (state.pet.stage === 'egg' || state.pet.stage === 'dead') return state

  let next = state
  const want = state.pet.want
  // 想要不存在或过期未完成时，按年龄片段生成下一个目标。
  if (!want || (want.completedAt === null && now > want.expiresAt)) {
    const newWant = createNextWant(state, now)
    next = {
      ...next,
      pet: {
        ...next.pet,
        want: newWant,
      },
    }
    events.push({ type: 'wantUpdated', want: newWant, at: now })
  }

  // 纪律低且长期忽视时触发行为问题，交互层通过 scold 等操作解除。
  if (
    !next.pet.misbehavior.active &&
    next.pet.discipline < 25 &&
    next.carePressure.neglectSeconds > 2 * 60 * 60
  ) {
    next = {
      ...next,
      pet: {
        ...next.pet,
        misbehavior: {
          active: true,
          kind: 'tantrum',
          startedAt: now,
        },
      },
    }
    events.push({ type: 'misbehaviorChanged', active: true, at: now })
  }

  return next
}

export function applyActivityCompletion(
  state: GameState,
  events: GameEvent[],
  now: number
): GameState {
  const activity = state.world.activity
  if (!activity || now < activity.endsAt) return state

  // 活动结束先统一解锁，再根据活动类型结算奖励或状态变化。
  events.push({ type: 'activityEnded', activityId: activity.id, at: now })
  const completed: GameState = {
    ...state,
    world: {
      ...state.world,
      activity: null,
      sceneId: activity.id === 'garden' ? 'garden' : 'home',
    },
    ui: {
      ...state.ui,
      lastToast: `${formatActivityLabel(activity.id)}已结束。`,
    },
  }

  if (activity.id === 'work') {
    return {
      ...completed,
      resources: {
        ...completed.resources,
        coins: completed.resources.coins + 16,
      },
      records: {
        ...completed.records,
        workShifts: completed.records.workShifts + 1,
      },
      ui: {
        ...completed.ui,
        lastToast: '打工结束，获得 16 金币。',
      },
    }
  }

  if (activity.id === 'vacation') {
    return {
      ...completed,
      pet: {
        ...completed.pet,
        onVacation: false,
        happiness: clamp(completed.pet.happiness + 20, STAT_MIN, STAT_MAX),
      },
      ui: {
        ...completed.ui,
        lastToast: '度假结束。',
      },
    }
  }

  if (activity.id !== 'school') return completed

  const missionResult = withMissionProgress(
    {
      state: {
        ...completed,
        resources: {
          ...completed.resources,
          coins: completed.resources.coins + 6,
        },
        pet: {
          ...completed.pet,
          discipline: clamp(completed.pet.discipline + 8, STAT_MIN, STAT_MAX),
          happiness: clamp(completed.pet.happiness + 4, STAT_MIN, STAT_MAX),
        },
        records: {
          ...completed.records,
          schoolLessons: completed.records.schoolLessons + 1,
        },
        ui: {
          ...completed.ui,
          lastToast: '学校课程结束，获得 6 金币。',
        },
      },
      events: [],
    },
    ['schoolDay'],
    now
  )
  events.push(...missionResult.events)
  return missionResult.state
}

export function applyMood(state: GameState): GameState {
  const pet = state.pet
  let mood: PetMood = 'idle'

  // 心情按优先级派生：睡眠、生病和低体力优先于普通快乐/难过表现。
  if (pet.stage === 'dead') mood = 'idle'
  else if (pet.sleepState === 'sleeping') mood = 'sleeping'
  else if (pet.sickness !== 'none') mood = 'sick'
  else if (pet.energy < 15) mood = 'sleepy'
  else if (pet.hunger > HUNGRY_THRESHOLD) mood = 'angry'
  else if (pet.happiness < 25) mood = 'sad'
  else if (pet.happiness > 75 && pet.hunger < 50) mood = 'happy'

  return {
    ...state,
    pet: {
      ...pet,
      mood,
    },
  }
}

function withMissionProgress(
  resultOrState: GameState | { state: GameState; events: GameEvent[] },
  missionIds: MissionId[],
  now: number
): InteractionResult {
  // 任务进度是幂等上限递增：已领取或已满进度的任务不会继续发事件。
  const input =
    'events' in resultOrState
      ? resultOrState
      : { state: resultOrState, events: [] }
  const updatedIds: MissionId[] = []
  const list = input.state.missions.list.map((mission) => {
    if (!missionIds.includes(mission.id) || mission.claimed) return mission
    if (mission.progress >= mission.goal) return mission

    updatedIds.push(mission.id)
    return {
      ...mission,
      progress: Math.min(mission.goal, mission.progress + 1),
    }
  })

  return {
    state: {
      ...input.state,
      missions: {
        ...input.state.missions,
        list,
      },
    },
    events: [
      ...input.events,
      ...updatedIds.map((missionId) => ({
        type: 'missionUpdated' as const,
        missionId,
        at: now,
      })),
    ],
  }
}

function createNextWant(state: GameState, now: number) {
  // 使用年龄片段而不是随机数，保证离线推进和测试结果可复现。
  const wantKinds = [
    'food',
    'play',
    'clean',
    'discipline',
    'garden',
    'social',
  ] as const
  const index =
    Math.abs(Math.floor(state.pet.ageSeconds / 300)) % wantKinds.length
  const kind = wantKinds[index]
  return {
    id: `want-${now}`,
    kind,
    label: `想要${formatWantKind(kind)}`,
    expiresAt: now + WANT_DURATION_SECONDS * 1000,
    completedAt: null,
  }
}

function formatStageLabel(stage: PetStage) {
  const labels: Record<PetStage, string> = {
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

function formatActivityLabel(
  activityId: NonNullable<GameState['world']['activity']>['id']
) {
  const labels: Record<string, string> = {
    arcade: '街机',
    bath: '洗澡',
    cleanRoom: '打扫房间',
    cooking: '烹饪',
    fortune: '占卜',
    garden: '花园',
    school: '学校',
    shop: '商店',
    toilet: '如厕',
    vacation: '度假',
    work: '打工',
  }
  return labels[activityId] ?? activityId
}

function formatWantKind(kind: NonNullable<GameState['pet']['want']>['kind']) {
  const labels: Record<NonNullable<GameState['pet']['want']>['kind'], string> =
    {
      clean: '清洁',
      discipline: '纪律',
      food: '食物',
      garden: '花园',
      play: '玩耍',
      social: '社交',
    }
  return labels[kind]
}

export function applyDeath(
  state: GameState,
  events: GameEvent[],
  now: number
): GameState {
  // health 和 deathSafety 任一仍有余量都不会死亡，给玩家留下补救窗口。
  if (
    state.pet.stage === 'dead' ||
    (state.pet.health > 0 && state.pet.deathSafety > 0)
  ) {
    return state
  }

  events.push({ type: 'died', reason: 'neglect', at: now })

  return {
    ...state,
    pet: {
      ...state.pet,
      stage: 'dead',
      mood: 'idle',
      sleepState: 'awake',
    },
    world: {
      ...state.world,
      activity: null,
      sceneId: 'home',
    },
    records: {
      ...state.records,
      deaths: state.records.deaths + 1,
    },
    ui: {
      ...state.ui,
      displayStack: [],
      lastToast: '宠物需要新的开始。',
    },
  }
}
