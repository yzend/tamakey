import { createInitialGame } from '../../game/application/createInitialGame'
import {
  GARDEN_GROW_SECONDS,
  GARDEN_WITHER_SECONDS,
} from '../../game/domain/constants'
import type {
  ActiveActivity,
  FriendState,
  GameState,
  PetStage,
  SocialPost,
} from '../../game/domain/gameTypes'

export type TestScenarioId =
  | 'egg'
  | 'baby-ready'
  | 'child-ready'
  | 'hungry'
  | 'dirty'
  | 'sick-mild'
  | 'sick-severe'
  | 'dead'
  | 'garden-ready'
  | 'mission-claimable'
  | 'activity-running'
  | 'social-online-enabled'

export type TestScenario = {
  id: TestScenarioId
  label: string
  create: (now: number, current?: GameState | null) => GameState
}

export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'egg',
    label: '蛋阶段',
    create: (now, current) =>
      preserveRuntimeFields(createInitialGame(now), current),
  },
  {
    id: 'baby-ready',
    label: '已孵化幼年',
    create: (now, current) =>
      preserveRuntimeFields(
        withStage(createInitialGame(now), 'baby', now),
        current
      ),
  },
  {
    id: 'child-ready',
    label: '童年',
    create: (now, current) =>
      preserveRuntimeFields(
        withStage(createInitialGame(now), 'child', now),
        current
      ),
  },
  {
    id: 'hungry',
    label: '饥饿',
    create: (now, current) => {
      const state = withStage(createInitialGame(now), 'baby', now)
      return preserveRuntimeFields(
        {
          ...state,
          pet: {
            ...state.pet,
            hunger: 96,
            happiness: 34,
            mood: 'angry',
            lastInteractionAt: now - 3_600_000,
          },
          carePressure: {
            ...state.carePressure,
            hungrySeconds: 4 * 60 * 60,
            neglectSeconds: 2 * 60 * 60,
          },
        },
        current
      )
    },
  },
  {
    id: 'dirty',
    label: '脏乱',
    create: (now, current) => {
      const state = withStage(createInitialGame(now), 'child', now)
      return preserveRuntimeFields(
        {
          ...state,
          pet: {
            ...state.pet,
            cleanliness: 8,
            bladder: 92,
            mood: 'sad',
          },
          world: {
            ...state.world,
            poopCount: 4,
            digestionSeconds: 3 * 60 * 60,
          },
          carePressure: {
            ...state.carePressure,
            dirtySeconds: 4 * 60 * 60,
          },
        },
        current
      )
    },
  },
  {
    id: 'sick-mild',
    label: '轻症',
    create: (now, current) => {
      const state = withStage(createInitialGame(now), 'child', now)
      return preserveRuntimeFields(
        {
          ...state,
          pet: {
            ...state.pet,
            sickness: 'mild',
            health: 68,
            mood: 'sick',
          },
          carePressure: {
            ...state.carePressure,
            sickSeconds: 60 * 60,
          },
        },
        current
      )
    },
  },
  {
    id: 'sick-severe',
    label: '重症',
    create: (now, current) => {
      const state = withStage(createInitialGame(now), 'child', now)
      return preserveRuntimeFields(
        {
          ...state,
          pet: {
            ...state.pet,
            sickness: 'severe',
            health: 28,
            mood: 'sick',
          },
          carePressure: {
            ...state.carePressure,
            sickSeconds: 7 * 60 * 60,
          },
        },
        current
      )
    },
  },
  {
    id: 'dead',
    label: '死亡',
    create: (now, current) => {
      const state = withStage(createInitialGame(now), 'child', now)
      return preserveRuntimeFields(
        {
          ...state,
          pet: {
            ...state.pet,
            stage: 'dead',
            mood: 'idle',
            sleepState: 'awake',
            health: 0,
            deathSafety: 0,
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
            lastToast: 'TestKit 已切换到死亡场景。',
          },
        },
        current
      )
    },
  },
  {
    id: 'garden-ready',
    label: '花园可收获',
    create: (now, current) => {
      const state = withStage(createInitialGame(now), 'child', now)
      const plantedAt = now - (GARDEN_GROW_SECONDS + 60) * 1000
      const readyAt = plantedAt + GARDEN_GROW_SECONDS * 1000
      return preserveRuntimeFields(
        {
          ...state,
          garden: {
            ...state.garden,
            plots: state.garden.plots.map((plot, index) =>
              index === 0
                ? {
                    ...plot,
                    cropId: 'sprout',
                    plantedAt,
                    wateredAt: plantedAt + 5_000,
                    readyAt,
                    witheredAt: readyAt + GARDEN_WITHER_SECONDS * 1000,
                  }
                : plot
            ),
          },
          ui: {
            ...state.ui,
            displayStack: ['garden'],
          },
        },
        current
      )
    },
  },
  {
    id: 'mission-claimable',
    label: '任务可领取',
    create: (now, current) => {
      const state = withStage(createInitialGame(now), 'child', now)
      return preserveRuntimeFields(
        {
          ...state,
          missions: {
            ...state.missions,
            list: state.missions.list.map((mission) =>
              mission.id === 'firstMeal'
                ? { ...mission, progress: mission.goal, claimed: false }
                : mission
            ),
          },
          ui: {
            ...state.ui,
            displayStack: ['stats'],
          },
        },
        current
      )
    },
  },
  {
    id: 'activity-running',
    label: '活动进行中',
    create: (now, current) => {
      const state = withStage(createInitialGame(now), 'child', now)
      const activity: ActiveActivity = {
        id: 'school',
        startedAt: now,
        endsAt: now + 12_000,
        locked: true,
      }
      return preserveRuntimeFields(
        {
          ...state,
          world: {
            ...state.world,
            activity,
            sceneId: 'school',
          },
        },
        current
      )
    },
  },
  {
    id: 'social-online-enabled',
    label: '社交/在线开启',
    create: (now, current) => {
      const state = withStage(createInitialGame(now), 'child', now)
      const friend: FriendState = {
        id: 'test-friend',
        name: 'Test Friend',
        code: 'LOCAL-TEST',
        friendship: 72,
        addedAt: now - 86_400_000,
      }
      const post: SocialPost = {
        id: 'test-post',
        author: state.profile.username,
        body: 'TestKit local update',
        createdAt: now - 60_000,
        likes: 3,
        local: true,
      }
      return preserveRuntimeFields(
        {
          ...state,
          friends: [friend],
          social: {
            ...state.social,
            posts: [post],
          },
          featureFlags: {
            ...state.featureFlags,
            social: true,
            onlineHub: true,
          },
          ui: {
            ...state.ui,
            displayStack: ['online'],
          },
        },
        current
      )
    },
  },
]

export function createTestScenarioState(
  scenarioId: TestScenarioId,
  now: number,
  current?: GameState | null
) {
  const scenario = TEST_SCENARIOS.find((item) => item.id === scenarioId)
  if (!scenario) return preserveRuntimeFields(createInitialGame(now), current)

  return scenario.create(now, current)
}

function withStage(
  state: GameState,
  stage: Exclude<PetStage, 'egg' | 'dead'>,
  now: number
) {
  const ageSeconds = getStageAgeSeconds(stage)
  return {
    ...state,
    pet: {
      ...state.pet,
      stage,
      ageSeconds,
      hatchedAt: now - ageSeconds * 1000,
      lastBirthdayAt: stage === 'baby' ? null : now - ageSeconds * 1000,
    },
  }
}

function getStageAgeSeconds(stage: Exclude<PetStage, 'egg' | 'dead'>) {
  const ages: Record<Exclude<PetStage, 'egg' | 'dead'>, number> = {
    baby: 4 * 60,
    child: 31 * 60,
    teen: 25 * 60 * 60,
    adult: 4 * 24 * 60 * 60,
    elder: 8 * 24 * 60 * 60,
  }

  return ages[stage]
}

function preserveRuntimeFields(
  state: GameState,
  current?: GameState | null
): GameState {
  if (!current) return state

  return {
    ...state,
    catalogs: current.catalogs,
    profile: {
      ...state.profile,
      username: current.profile.username,
      friendCode: current.profile.friendCode,
    },
    settings: {
      ...current.settings,
      fastHatch: state.settings.fastHatch,
      theme: current.settings.theme,
    },
    featureFlags: {
      ...current.featureFlags,
      ...state.featureFlags,
    },
  }
}
