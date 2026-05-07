import type {
  GameEvent,
  GameCommand,
  GameState,
  InteractionType,
  ActivityId,
  MenuId,
  PetMood,
  PetStage,
  SicknessState,
  SleepState,
} from '../domain/gameTypes'

export type {
  GameEvent,
  GameCommand,
  InteractionType,
  MenuId,
  PetMood,
  PetStage,
  SicknessState,
  SleepState,
}

export type QueuedGameEvent = GameEvent & {
  queueId: number
}

export type PetViewModel = {
  stage: PetStage
  mood: PetMood
  sleepState: SleepState
  sickness: SicknessState
  poopCount: number
  roomId: string
  sceneId: GameState['world']['sceneId']
  activityId: ActivityId | null
  activityStartedAt?: number | null
  activityEndsAt?: number | null
  furniture: string[]
  accessories?: string[]
  weather?: 'clear' | 'rain' | 'wind' | 'night'
  socialState?: 'offline' | 'available' | 'busy'
  gardenReadyCount: number
}

export type PetStatsViewModel = {
  hunger: number
  happiness: number
  cleanliness: number
  energy: number
  health: number
  bladder: number
}

export type PetScreenSnapshot = PetViewModel & {
  stats: PetStatsViewModel
  ageLabel: string
  menuStack: MenuId[]
  toast: string | null
  coins: number
  medicine: number
  seedCount: number
  harvestCount: number
  soapCount: number
  foodCount: number
  missions: GameState['missions']['list']
  plots: GameState['garden']['plots']
  settings: GameState['settings']
  featureFlags: GameState['featureFlags']
  records: GameState['records']
  profile: GameState['profile']
  friends: GameState['friends']
  socialPosts: GameState['social']['posts']
  mockOnlinePets: GameState['mockOnline']['pets']
  controlsLocked: boolean
  lockReason: string | null
}

export function selectPetViewModel(state: GameState): PetViewModel {
  return {
    stage: state.pet.stage,
    mood: state.pet.mood,
    sleepState: state.pet.sleepState,
    sickness: state.pet.sickness,
    poopCount: state.world.poopCount,
    roomId: state.world.roomId,
    sceneId: state.world.sceneId,
    activityId: state.world.activity?.id ?? null,
    activityStartedAt: state.world.activity?.startedAt ?? null,
    activityEndsAt: state.world.activity?.endsAt ?? null,
    furniture: state.world.furniture,
    accessories: state.pet.equippedAccessories.map((item) => item.itemId),
    weather:
      state.pet.sleepState === 'sleeping' ? 'night' : state.world.weather,
    socialState:
      state.world.activity?.id === 'vacation'
        ? 'busy'
        : state.featureFlags.social && state.friends.length > 0
          ? 'available'
          : 'offline',
    gardenReadyCount: state.garden.plots.filter((plot) => plot.readyAt !== null)
      .length,
  }
}
