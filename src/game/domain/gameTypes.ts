export type PetStage =
  | 'egg'
  | 'baby'
  | 'child'
  | 'teen'
  | 'adult'
  | 'elder'
  | 'dead'

export type PetMood =
  | 'idle'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'sick'
  | 'sleepy'
  | 'sleeping'
  | 'proud'
  | 'curious'

export type SicknessState = 'none' | 'mild' | 'severe'
export type SleepState = 'awake' | 'sleeping'

export type InventoryItem = {
  id: string
  quantity: number
}

export type MenuId =
  | 'main'
  | 'feeding'
  | 'bath'
  | 'care'
  | 'stats'
  | 'activity'
  | 'shop'
  | 'school'
  | 'stuff'
  | 'garden'
  | 'phone'
  | 'social'
  | 'online'
  | 'settings'

export type SceneId =
  | 'home'
  | 'bathroom'
  | 'bedroom'
  | 'shop'
  | 'school'
  | 'garden'
  | 'kitchen'
  | 'arcade'
  | 'work'
  | 'park'
  | 'online'
  | 'social'
  | 'vacation'

export type ActivityId =
  | 'bath'
  | 'toilet'
  | 'cleanRoom'
  | 'shop'
  | 'mall'
  | 'market'
  | 'school'
  | 'garden'
  | 'cooking'
  | 'arcade'
  | 'work'
  | 'fortune'
  | 'rabbitHole'
  | 'vacation'
  | 'snapMeal'

export type ActiveActivity = {
  id: ActivityId
  startedAt: number
  endsAt: number
  locked: boolean
}

export type MissionId =
  | 'firstMeal'
  | 'cleanHome'
  | 'dailyCare'
  | 'gardenStart'
  | 'schoolDay'
  | 'firstFriend'
  | 'craftDecor'
  | 'socialPost'
  | 'arcadeRun'

export type MissionState = {
  id: MissionId
  label: string
  progress: number
  goal: number
  rewardCoins: number
  claimed: boolean
}

export type GardenPlotState = {
  id: string
  cropId: string | null
  plantedAt: number | null
  wateredAt: number | null
  readyAt: number | null
  witheredAt: number | null
}

export type GardenState = {
  plots: GardenPlotState[]
  harvests: InventoryItem[]
  animals: AnimalState[]
  weather: WeatherState
  buffUntil: number | null
}

export type WantState = {
  id: string
  kind: 'food' | 'play' | 'clean' | 'discipline' | 'garden' | 'social'
  label: string
  targetId?: string
  expiresAt: number
  completedAt: number | null
}

export type MisbehaviorState = {
  active: boolean
  kind: 'mess' | 'tantrum' | 'refuse' | 'none'
  startedAt: number | null
}

export type SkillSet = {
  expression: number
  logic: number
  endurance: number
}

export type FamilyEntry = {
  id: string
  name: string
  stage: PetStage
  generation: number
  movedOutAt: number
}

export type FriendState = {
  id: string
  name: string
  code: string
  friendship: number
  addedAt: number
}

export type SocialPost = {
  id: string
  author: string
  body: string
  createdAt: number
  likes: number
  local: boolean
}

export type MockOnlinePet = {
  id: string
  name: string
  stage: PetStage
  mood: PetMood
  owner: string
  lastSeenAt: number
}

export type MockOnlineState = {
  pets: MockOnlinePet[]
  interactions: Array<{
    id: string
    petId: string
    action: string
    createdAt: number
  }>
}

export type ShopCatalogItem = {
  id: string
  label: string
  kind: 'food' | 'seed' | 'medicine' | 'furniture' | 'accessory' | 'material'
  price: number
  effect?: Partial<Pick<PetState, 'hunger' | 'happiness' | 'energy' | 'health'>>
}

export type CraftRecipe = {
  id: string
  label: string
  cost: InventoryItem[]
  output: InventoryItem
  outputBucket: 'items' | 'furniture' | 'accessories' | 'food'
}

export type FurniturePlacement = {
  id: string
  itemId: string
  x: number
  y: number
}

export type AccessorySlot = 'head' | 'face' | 'body'

export type EquippedAccessory = {
  slot: AccessorySlot
  itemId: string
}

export type AnimalState = {
  id: string
  species: 'helper-bird' | 'garden-cat'
  happiness: number
  fedAt: number | null
}

export type WeatherState = 'clear' | 'rain' | 'wind'

export type EvolutionRule = {
  from: PetStage
  to: PetStage
  minAgeSeconds: number
  minCare?: number
  minSkill?: keyof SkillSet
}

export type ActivityDefinition = {
  id: ActivityId
  label: string
  durationSeconds: number
  sceneId: SceneId
  rewardCoins: number
}

export type MinigameAdapter = {
  id: string
  label: string
  rewardCoins: number
  skill: keyof SkillSet
}

export type ProfileState = {
  username: string
  generation: number
  achievements: string[]
  friendCode: string
}

export type RecordState = {
  mealsFed: number
  snacksFed: number
  bathsTaken: number
  toiletsUsed: number
  sleepsStarted: number
  gamesPlayed: number
  schoolLessons: number
  shopPurchases: number
  plantsHarvested: number
  birthdays: number
  deaths: number
  revives: number
  socialPosts: number
  craftsCompleted: number
  arcadeRuns: number
  workShifts: number
  vacations: number
}

export type UiState = {
  displayStack: MenuId[]
  lastToast: string | null
}

export type PetState = {
  id: string
  name: string
  species: string
  stage: PetStage
  mood: PetMood
  ageSeconds: number
  hunger: number
  happiness: number
  cleanliness: number
  bladder: number
  energy: number
  health: number
  discipline: number
  care: number
  deathSafety: number
  sickness: SicknessState
  sleepState: SleepState
  careMistakes: number
  traits: string[]
  skills: SkillSet
  want: WantState | null
  misbehavior: MisbehaviorState
  atParents: boolean
  onVacation: boolean
  equippedAccessories: EquippedAccessory[]
  bornAt: number
  hatchedAt: number | null
  lastBirthdayAt: number | null
  lastInteractionAt: number
}

export type GameState = {
  version: number
  schemaVersion: 3
  pet: PetState
  resources: {
    coins: number
    food: InventoryItem[]
    items: InventoryItem[]
    seeds: InventoryItem[]
    furniture: InventoryItem[]
    accessories: InventoryItem[]
    medicine: number
    materials: InventoryItem[]
  }
  world: {
    sceneId: SceneId
    activity: ActiveActivity | null
    poopCount: number
    roomId: string
    digestionSeconds: number
    furniture: string[]
    furniturePlacements: FurniturePlacement[]
    weather: WeatherState
  }
  carePressure: {
    hungrySeconds: number
    dirtySeconds: number
    sickSeconds: number
    neglectSeconds: number
  }
  missions: {
    dailySeed: string
    resetAt: number
    points: number
    list: MissionState[]
  }
  garden: GardenState
  profile: ProfileState
  friends: FriendState[]
  social: {
    posts: SocialPost[]
    draft: string
  }
  mockOnline: MockOnlineState
  catalogs: {
    shop: ShopCatalogItem[]
    craft: CraftRecipe[]
    activities: ActivityDefinition[]
    minigames: MinigameAdapter[]
    evolutions: EvolutionRule[]
  }
  records: RecordState
  settings: {
    notificationsEnabled: boolean
    reducedMotion: boolean
    soundEnabled: boolean
    fastHatch: boolean
    theme: 'classic' | 'mint' | 'contrast'
    pwaUpdateAvailable: boolean
  }
  featureFlags: {
    onlineHub: boolean
    social: boolean
    mods: boolean
  }
  ui: UiState
  createdAt: number
  lastTickAt: number
  lastSavedAt: number | null
}

export type InteractionType =
  | 'feedMeal'
  | 'feedSnack'
  | 'play'
  | 'clean'
  | 'bath'
  | 'toilet'
  | 'cleanRoom'
  | 'medicine'
  | 'brushTeeth'
  | 'praise'
  | 'scold'
  | 'pet'
  | 'sleep'
  | 'wake'
  | 'birthday'
  | 'revive'
  | 'newEgg'
  | 'openMenu'
  | 'closeMenu'
  | 'startActivity'
  | 'endActivity'
  | 'claimMission'
  | 'plant'
  | 'water'
  | 'harvest'
  | 'buyItem'
  | 'buyShopItem'
  | 'useItem'
  | 'cook'
  | 'craftItem'
  | 'placeFurniture'
  | 'removeFurniture'
  | 'equipAccessory'
  | 'unequipAccessory'
  | 'startMinigame'
  | 'finishMinigame'
  | 'work'
  | 'fortune'
  | 'moveOut'
  | 'startVacation'
  | 'endVacation'
  | 'addFriend'
  | 'removeFriend'
  | 'postSocial'
  | 'likeSocialPost'
  | 'refreshOnline'
  | 'interactOnlinePet'
  | 'snapMeal'
  | 'toggleSetting'
  | 'toggleFeature'
  | 'updateProfile'
  | 'exportSave'
  | 'importSave'
  | 'importMod'

export type GameCommandPayload =
  | { kind: 'menu'; menuId: MenuId }
  | { kind: 'activity'; activityId: ActivityId; result?: 'win' | 'lose' }
  | { kind: 'inventory'; itemId: string; bucket?: keyof GameState['resources'] }
  | { kind: 'garden'; plotId: string; seedId?: string; animalId?: string }
  | {
      kind: 'settings'
      key: keyof GameState['settings']
      value: boolean | string
    }
  | { kind: 'feature'; key: keyof GameState['featureFlags']; value: boolean }
  | { kind: 'social'; postId?: string; body?: string; friendCode?: string }
  | { kind: 'profile'; username: string }
  | { kind: 'online'; petId?: string; action?: string }
  | { kind: 'importExport'; text?: string }
  | { kind: 'mod'; text: string }

export type GameCommand = {
  type: InteractionType
  targetId?: string
  value?: string
  payload?: GameCommandPayload
}

export type GameEvent =
  | { type: 'hatched'; at: number }
  | { type: 'evolved'; from: PetStage; to: PetStage; at: number }
  | { type: 'revived'; at: number }
  | { type: 'newEggCreated'; at: number }
  | { type: 'poopCreated'; count: number; at: number }
  | { type: 'becameSick'; sickness: SicknessState; at: number }
  | { type: 'recovered'; at: number }
  | { type: 'died'; reason: 'hunger' | 'sickness' | 'neglect'; at: number }
  | { type: 'interactionApplied'; interaction: InteractionType; at: number }
  | { type: 'wantUpdated'; want: WantState | null; at: number }
  | { type: 'misbehaviorChanged'; active: boolean; at: number }
  | { type: 'missionUpdated'; missionId: MissionId; at: number }
  | {
      type: 'missionClaimed'
      missionId: MissionId
      rewardCoins: number
      at: number
    }
  | { type: 'activityStarted'; activityId: ActivityId; at: number }
  | { type: 'activityEnded'; activityId: ActivityId; at: number }
  | { type: 'saveImported'; at: number }
  | { type: 'saveRejected'; reason: string; at: number }
  | { type: 'modImported'; name: string; at: number }
  | { type: 'gardenUpdated'; plotId: string; at: number }
  | { type: 'inventoryChanged'; itemId: string; at: number }
  | { type: 'socialUpdated'; at: number }
  | { type: 'mockOnlineUpdated'; at: number }
  | { type: 'errorRecovered'; message: string; at: number }
  | {
      type: 'invalidInteraction'
      interaction: InteractionType
      reason: string
      at: number
    }

export type AdvanceResult = {
  state: GameState
  events: GameEvent[]
}

export type OfflineSummary = {
  elapsedMs: number
  simulatedMs: number
  messages: string[]
}

export type RestoreResult = {
  state: GameState
  events: GameEvent[]
  offlineSummary: OfflineSummary | null
  recoveredFromCorruptSave: boolean
}

export type InteractionContext = {
  now: number
  command: GameCommand
}

export type InteractionResult = {
  state: GameState
  events: GameEvent[]
}

export type InteractionHandler = {
  canApply(state: GameState, command: GameCommand): boolean
  apply(state: GameState, context: InteractionContext): InteractionResult
}

export type InteractionRegistry = Partial<
  Record<InteractionType, InteractionHandler>
>

export type SaveData = {
  schemaVersion: 3
  savedAt: number
  game: Omit<GameState, 'ui' | 'settings' | 'profile'>
  settings: GameState['settings']
  profile: GameState['profile']
}

export type LoadSaveResult =
  | { status: 'empty'; data: null }
  | { status: 'ok'; data: SaveData }
  | { status: 'corrupt'; data: null; raw: string | null; error: unknown }

export type ReminderReason =
  | 'hungry'
  | 'dirty'
  | 'sick'
  | 'lonely'
  | 'energyFull'

export type Reminder = {
  id: string
  at: number
  title: string
  body: string
  reason: ReminderReason
}

export type ReminderPlan = {
  reminders: Reminder[]
}
