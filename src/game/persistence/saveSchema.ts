import { createInitialGame } from '../application/createInitialGame'
import { SAVE_SCHEMA_VERSION } from '../domain/constants'
import type {
  AccessorySlot,
  GameState,
  MenuId,
  PetMood,
  PetStage,
  SaveData as DomainSaveData,
  SceneId,
  SicknessState,
  SleepState,
  WeatherState,
} from '../domain/gameTypes'

export type SaveData = DomainSaveData

const petStages: ReadonlySet<PetStage> = new Set([
  'egg',
  'baby',
  'child',
  'teen',
  'adult',
  'elder',
  'dead',
])

const petMoods: ReadonlySet<PetMood> = new Set([
  'idle',
  'happy',
  'sad',
  'angry',
  'sick',
  'sleepy',
  'sleeping',
  'proud',
  'curious',
])

const sicknessStates: ReadonlySet<SicknessState> = new Set([
  'none',
  'mild',
  'severe',
])

const sleepStates: ReadonlySet<SleepState> = new Set(['awake', 'sleeping'])

const weatherStates: ReadonlySet<WeatherState> = new Set([
  'clear',
  'rain',
  'wind',
])

const themeNames = new Set([
  'classic',
  'mint',
  'contrast',
  'sakura',
  'aqua',
  'grape',
  'toyblue',
  'strawberry',
  'matcha',
] as const)

const sceneIds: ReadonlySet<SceneId> = new Set([
  'home',
  'bathroom',
  'bedroom',
  'shop',
  'school',
  'garden',
  'kitchen',
  'arcade',
  'work',
  'park',
  'online',
  'social',
  'vacation',
])

const accessorySlots: ReadonlySet<AccessorySlot> = new Set([
  'head',
  'face',
  'body',
])

const menuIds: ReadonlySet<MenuId> = new Set([
  'main',
  'feeding',
  'bath',
  'care',
  'stats',
  'activity',
  'shop',
  'school',
  'stuff',
  'garden',
  'phone',
  'social',
  'online',
  'settings',
])

type SaveVersion = 1 | 2 | 3

export function validateSaveData(value: unknown): SaveData {
  if (!isRecord(value)) {
    throw new Error('存档数据必须是对象')
  }

  const version = value.schemaVersion
  if (version === 1 || version === 2) {
    return migrateLegacySaveData(value, version)
  }

  if (version !== SAVE_SCHEMA_VERSION) {
    throw new Error('不支持的存档结构')
  }

  const data = value as Partial<SaveData>
  assertNumber(data.savedAt, 'savedAt')
  validatePersistedGame(data.game)
  validateSettings(data.settings)
  validateProfile(data.profile)

  return data as SaveData
}

export function hydrateSavedGame(save: SaveData): GameState {
  return {
    ...save.game,
    settings: save.settings,
    profile: save.profile,
    ui: {
      displayStack: [],
      lastToast: null,
    },
  }
}

export function createSaveData(state: GameState, savedAt: number): SaveData {
  const {
    ui: _ui,
    settings,
    profile,
    ...game
  } = {
    ...state,
    schemaVersion: SAVE_SCHEMA_VERSION as GameState['schemaVersion'],
    lastSavedAt: savedAt,
  }

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAt,
    game,
    settings,
    profile,
  }
}

export function validateGameState(value: unknown): asserts value is GameState {
  validatePersistedGame(value)
  if (!isRecord(value)) throw new Error('游戏状态必须是对象')
  validateSettings(value.settings)
  validateProfile(value.profile)

  if (!isRecord(value.ui)) throw new Error('游戏状态缺少 ui')
  if (!Array.isArray(value.ui.displayStack)) {
    throw new Error('ui.displayStack 必须是数组')
  }
  for (const item of value.ui.displayStack) {
    assertMember(item, menuIds, 'ui.displayStack item')
  }
}

function validatePersistedGame(value: unknown): void {
  if (!isRecord(value)) throw new Error('已保存的游戏必须是对象')

  const state = value as Partial<GameState>

  if (state.schemaVersion !== SAVE_SCHEMA_VERSION) {
    throw new Error(`已保存游戏的 schemaVersion 必须是 ${SAVE_SCHEMA_VERSION}`)
  }

  assertNumber(state.version, 'version')
  assertNumber(state.createdAt, 'createdAt')
  assertNumber(state.lastTickAt, 'lastTickAt')

  if (
    state.lastSavedAt !== null &&
    state.lastSavedAt !== undefined &&
    typeof state.lastSavedAt !== 'number'
  ) {
    throw new Error('lastSavedAt 必须是数字或 null')
  }

  validatePet(state.pet)
  validateResources(state.resources)
  validateWorld(state.world)
  validateCarePressure(state.carePressure)
  validateMissions(state.missions)
  validateGarden(state.garden)
  validateRecords(state.records)
  validateFeatureFlags(state.featureFlags)

  if (!Array.isArray(state.friends)) throw new Error('friends 必须是数组')
  validateSocial(state.social)
  validateMockOnline(state.mockOnline)
  validateCatalogs(state.catalogs)
}

function migrateLegacySaveData(
  value: Record<string, unknown>,
  version: SaveVersion
): SaveData {
  const savedAt = finiteNumberOr(value.savedAt, Date.now())
  const legacyState =
    version === 1
      ? isRecord(value.gameState)
        ? value.gameState
        : {}
      : isRecord(value.game)
        ? value.game
        : {}
  const settings = isRecord(value.settings)
    ? value.settings
    : isRecord(legacyState.settings)
      ? legacyState.settings
      : {}
  const profile = isRecord(value.profile)
    ? value.profile
    : isRecord(legacyState.profile)
      ? legacyState.profile
      : {}
  const migrated = completeGameState(legacyState, settings, profile, savedAt)

  return createSaveData(migrated, savedAt)
}

function completeGameState(
  source: Record<string, unknown>,
  sourceSettings: Record<string, unknown>,
  sourceProfile: Record<string, unknown>,
  savedAt: number
): GameState {
  const baseline = createInitialGame(savedAt) as GameState
  const pet = isRecord(source.pet) ? source.pet : {}
  const resources = isRecord(source.resources) ? source.resources : {}
  const world = isRecord(source.world) ? source.world : {}
  const carePressure = isRecord(source.carePressure) ? source.carePressure : {}
  const missions = isRecord(source.missions) ? source.missions : {}
  const garden = isRecord(source.garden) ? source.garden : {}
  const records = isRecord(source.records) ? source.records : {}
  const featureFlags = isRecord(source.featureFlags) ? source.featureFlags : {}
  const social = isRecord(source.social) ? source.social : {}
  const mockOnline = isRecord(source.mockOnline) ? source.mockOnline : {}
  const catalogs = isRecord(source.catalogs) ? source.catalogs : {}

  return {
    ...baseline,
    version: finiteNumberOr(source.version, baseline.version),
    schemaVersion: SAVE_SCHEMA_VERSION,
    pet: {
      ...baseline.pet,
      id: stringOr(pet.id, baseline.pet.id),
      name: stringOr(pet.name, baseline.pet.name),
      species: stringOr(pet.species, baseline.pet.species),
      stage: memberOr(pet.stage, petStages, baseline.pet.stage),
      mood: memberOr(pet.mood, petMoods, baseline.pet.mood),
      ageSeconds: finiteNumberOr(pet.ageSeconds, baseline.pet.ageSeconds),
      hunger: percentOr(pet.hunger, baseline.pet.hunger),
      happiness: percentOr(pet.happiness, baseline.pet.happiness),
      cleanliness: percentOr(pet.cleanliness, baseline.pet.cleanliness),
      bladder: percentOr(pet.bladder, baseline.pet.bladder ?? 0),
      energy: percentOr(pet.energy, baseline.pet.energy),
      health: percentOr(pet.health, baseline.pet.health),
      discipline: percentOr(pet.discipline, baseline.pet.discipline ?? 20),
      care: percentOr(pet.care, baseline.pet.care ?? 50),
      deathSafety: percentOr(pet.deathSafety, baseline.pet.deathSafety ?? 100),
      sickness: memberOr(pet.sickness, sicknessStates, baseline.pet.sickness),
      sleepState: memberOr(
        pet.sleepState,
        sleepStates,
        baseline.pet.sleepState
      ),
      careMistakes: finiteNumberOr(pet.careMistakes, baseline.pet.careMistakes),
      traits: stringArrayOr(pet.traits, []),
      skills: skillsOr(pet.skills),
      want: null,
      misbehavior: misbehaviorOr(pet.misbehavior),
      atParents: booleanOr(pet.atParents, false),
      onVacation: booleanOr(pet.onVacation, false),
      equippedAccessories: equippedAccessoriesOr(pet.equippedAccessories),
      bornAt: finiteNumberOr(pet.bornAt, baseline.pet.bornAt),
      hatchedAt: numberOrNullOr(pet.hatchedAt, baseline.pet.hatchedAt),
      lastBirthdayAt: numberOrNullOr(
        pet.lastBirthdayAt,
        baseline.pet.lastBirthdayAt
      ),
      lastInteractionAt: finiteNumberOr(
        pet.lastInteractionAt,
        baseline.pet.lastInteractionAt
      ),
    },
    resources: {
      ...baseline.resources,
      coins: finiteNumberOr(resources.coins, baseline.resources.coins),
      food: inventoryOr(resources.food, baseline.resources.food),
      items: inventoryOr(resources.items, baseline.resources.items ?? []),
      seeds: inventoryOr(resources.seeds, baseline.resources.seeds ?? []),
      furniture: inventoryOr(
        resources.furniture,
        baseline.resources.furniture ?? []
      ),
      accessories: inventoryOr(
        resources.accessories,
        baseline.resources.accessories ?? []
      ),
      medicine: finiteNumberOr(resources.medicine, baseline.resources.medicine),
      materials: inventoryOr(resources.materials, []),
    },
    world: {
      ...baseline.world,
      sceneId: memberOr(world.sceneId, sceneIds, baseline.world.sceneId),
      activity: null,
      poopCount: finiteNumberOr(world.poopCount, baseline.world.poopCount),
      roomId: stringOr(world.roomId, baseline.world.roomId),
      digestionSeconds: finiteNumberOr(
        world.digestionSeconds,
        baseline.world.digestionSeconds
      ),
      furniture: stringArrayOr(world.furniture, baseline.world.furniture ?? []),
      furniturePlacements: furniturePlacementsOr(world.furniturePlacements),
      weather: memberOr(world.weather, weatherStates, 'clear'),
    },
    carePressure: {
      ...baseline.carePressure,
      hungrySeconds: finiteNumberOr(
        carePressure.hungrySeconds,
        baseline.carePressure.hungrySeconds
      ),
      dirtySeconds: finiteNumberOr(
        carePressure.dirtySeconds,
        baseline.carePressure.dirtySeconds
      ),
      sickSeconds: finiteNumberOr(
        carePressure.sickSeconds,
        baseline.carePressure.sickSeconds
      ),
      neglectSeconds: finiteNumberOr(
        carePressure.neglectSeconds,
        baseline.carePressure.neglectSeconds ?? 0
      ),
    },
    missions: {
      ...baseline.missions,
      dailySeed: stringOr(missions.dailySeed, baseline.missions.dailySeed),
      resetAt: finiteNumberOr(missions.resetAt, baseline.missions.resetAt),
      points: finiteNumberOr(missions.points, baseline.missions.points),
      list: Array.isArray(missions.list)
        ? baseline.missions.list
        : baseline.missions.list,
    },
    garden: {
      ...baseline.garden,
      plots: Array.isArray(garden.plots) ? garden.plots : baseline.garden.plots,
      harvests: inventoryOr(garden.harvests, baseline.garden.harvests),
      animals: Array.isArray(garden.animals) ? garden.animals : [],
      weather: memberOr(garden.weather, weatherStates, 'clear'),
      buffUntil: numberOrNullOr(garden.buffUntil, null),
    },
    profile: {
      ...baseline.profile,
      username: stringOr(sourceProfile.username, baseline.profile.username),
      generation: finiteNumberOr(
        sourceProfile.generation,
        baseline.profile.generation
      ),
      achievements: stringArrayOr(sourceProfile.achievements, []),
      friendCode: stringOr(sourceProfile.friendCode, createFriendCode(savedAt)),
    },
    friends: Array.isArray(source.friends) ? source.friends : [],
    social: {
      posts: Array.isArray(social.posts) ? social.posts : [],
      draft: stringOr(social.draft, ''),
    },
    mockOnline: {
      pets: Array.isArray(mockOnline.pets) ? mockOnline.pets : [],
      interactions: Array.isArray(mockOnline.interactions)
        ? mockOnline.interactions
        : [],
    },
    catalogs: {
      shop: Array.isArray(catalogs.shop) ? catalogs.shop : [],
      craft: Array.isArray(catalogs.craft) ? catalogs.craft : [],
      activities: Array.isArray(catalogs.activities) ? catalogs.activities : [],
      minigames: Array.isArray(catalogs.minigames) ? catalogs.minigames : [],
      evolutions: Array.isArray(catalogs.evolutions) ? catalogs.evolutions : [],
    },
    records: {
      ...baseline.records,
      mealsFed: finiteNumberOr(records.mealsFed, baseline.records.mealsFed),
      snacksFed: finiteNumberOr(records.snacksFed, baseline.records.snacksFed),
      bathsTaken: finiteNumberOr(
        records.bathsTaken,
        baseline.records.bathsTaken
      ),
      toiletsUsed: finiteNumberOr(
        records.toiletsUsed,
        baseline.records.toiletsUsed
      ),
      sleepsStarted: finiteNumberOr(
        records.sleepsStarted,
        baseline.records.sleepsStarted
      ),
      gamesPlayed: finiteNumberOr(
        records.gamesPlayed,
        baseline.records.gamesPlayed
      ),
      schoolLessons: finiteNumberOr(
        records.schoolLessons,
        baseline.records.schoolLessons
      ),
      shopPurchases: finiteNumberOr(
        records.shopPurchases,
        baseline.records.shopPurchases
      ),
      plantsHarvested: finiteNumberOr(
        records.plantsHarvested,
        baseline.records.plantsHarvested
      ),
      birthdays: finiteNumberOr(records.birthdays, baseline.records.birthdays),
      deaths: finiteNumberOr(records.deaths, baseline.records.deaths),
      revives: finiteNumberOr(records.revives, baseline.records.revives),
      socialPosts: finiteNumberOr(records.socialPosts, 0),
      craftsCompleted: finiteNumberOr(records.craftsCompleted, 0),
      arcadeRuns: finiteNumberOr(records.arcadeRuns, 0),
      workShifts: finiteNumberOr(records.workShifts, 0),
      vacations: finiteNumberOr(records.vacations, 0),
    },
    settings: {
      ...baseline.settings,
      notificationsEnabled: booleanOr(
        sourceSettings.notificationsEnabled,
        baseline.settings.notificationsEnabled
      ),
      reducedMotion: booleanOr(
        sourceSettings.reducedMotion,
        baseline.settings.reducedMotion
      ),
      soundEnabled: booleanOr(
        sourceSettings.soundEnabled,
        baseline.settings.soundEnabled
      ),
      fastHatch: booleanOr(
        sourceSettings.fastHatch,
        baseline.settings.fastHatch
      ),
      theme: memberOr(sourceSettings.theme, themeNames, 'classic'),
      pwaUpdateAvailable: booleanOr(sourceSettings.pwaUpdateAvailable, false),
    },
    featureFlags: {
      onlineHub: booleanOr(featureFlags.onlineHub, false),
      social: booleanOr(featureFlags.social, false),
      mods: booleanOr(featureFlags.mods, false),
    },
    createdAt: finiteNumberOr(source.createdAt, baseline.createdAt),
    lastTickAt: finiteNumberOr(source.lastTickAt, baseline.lastTickAt),
    lastSavedAt: numberOrNullOr(source.lastSavedAt, null),
  }
}

function validatePet(value: unknown): void {
  if (!isRecord(value)) throw new Error('游戏状态缺少 pet')

  assertString(value.id, 'pet.id')
  assertString(value.name, 'pet.name')
  assertString(value.species, 'pet.species')
  assertMember(value.stage, petStages, 'pet.stage')
  assertMember(value.mood, petMoods, 'pet.mood')
  assertNumber(value.ageSeconds, 'pet.ageSeconds')
  assertPercent(value.hunger, 'pet.hunger')
  assertPercent(value.happiness, 'pet.happiness')
  assertPercent(value.cleanliness, 'pet.cleanliness')
  assertPercent(value.bladder, 'pet.bladder')
  assertPercent(value.energy, 'pet.energy')
  assertPercent(value.health, 'pet.health')
  assertPercent(value.discipline, 'pet.discipline')
  assertPercent(value.care, 'pet.care')
  assertPercent(value.deathSafety, 'pet.deathSafety')
  assertMember(value.sickness, sicknessStates, 'pet.sickness')
  assertMember(value.sleepState, sleepStates, 'pet.sleepState')
  assertNumber(value.careMistakes, 'pet.careMistakes')
  if (!Array.isArray(value.traits)) throw new Error('pet.traits 必须是数组')
  validateSkills(value.skills)
  if (!isRecord(value.misbehavior)) {
    throw new Error('pet.misbehavior 必须是对象')
  }
  assertBoolean(value.atParents, 'pet.atParents')
  assertBoolean(value.onVacation, 'pet.onVacation')
  if (!Array.isArray(value.equippedAccessories)) {
    throw new Error('pet.equippedAccessories 必须是数组')
  }
  assertNumber(value.bornAt, 'pet.bornAt')
  assertNumberOrNull(value.hatchedAt, 'pet.hatchedAt')
  assertNumberOrNull(value.lastBirthdayAt, 'pet.lastBirthdayAt')
  assertNumber(value.lastInteractionAt, 'pet.lastInteractionAt')
}

function validateResources(value: unknown): void {
  if (!isRecord(value)) throw new Error('游戏状态缺少 resources')

  assertNumber(value.coins, 'resources.coins')
  assertNumber(value.medicine, 'resources.medicine')
  validateInventory(value.food, 'resources.food')
  validateInventory(value.items, 'resources.items')
  validateInventory(value.seeds, 'resources.seeds')
  validateInventory(value.furniture, 'resources.furniture')
  validateInventory(value.accessories, 'resources.accessories')
  validateInventory(value.materials, 'resources.materials')
}

function validateWorld(value: unknown): void {
  if (!isRecord(value)) throw new Error('游戏状态缺少 world')

  assertString(value.sceneId, 'world.sceneId')
  assertNumber(value.poopCount, 'world.poopCount')
  assertString(value.roomId, 'world.roomId')
  assertNumber(value.digestionSeconds, 'world.digestionSeconds')
  if (!Array.isArray(value.furniture)) {
    throw new Error('world.furniture 必须是数组')
  }
  if (!Array.isArray(value.furniturePlacements)) {
    throw new Error('world.furniturePlacements 必须是数组')
  }
  assertMember(value.weather, weatherStates, 'world.weather')
}

function validateCarePressure(value: unknown): void {
  if (!isRecord(value)) throw new Error('游戏状态缺少 carePressure')

  assertNumber(value.hungrySeconds, 'carePressure.hungrySeconds')
  assertNumber(value.dirtySeconds, 'carePressure.dirtySeconds')
  assertNumber(value.sickSeconds, 'carePressure.sickSeconds')
  assertNumber(value.neglectSeconds, 'carePressure.neglectSeconds')
}

function validateMissions(value: unknown): void {
  if (!isRecord(value)) throw new Error('游戏状态缺少 missions')
  assertString(value.dailySeed, 'missions.dailySeed')
  assertNumber(value.resetAt, 'missions.resetAt')
  assertNumber(value.points, 'missions.points')
  if (!Array.isArray(value.list)) throw new Error('missions.list 必须是数组')
}

function validateGarden(value: unknown): void {
  if (!isRecord(value)) throw new Error('游戏状态缺少 garden')
  if (!Array.isArray(value.plots)) throw new Error('garden.plots 必须是数组')
  validateInventory(value.harvests, 'garden.harvests')
  if (!Array.isArray(value.animals))
    throw new Error('garden.animals 必须是数组')
  assertMember(value.weather, weatherStates, 'garden.weather')
  assertNumberOrNull(value.buffUntil, 'garden.buffUntil')
}

function validateProfile(value: unknown): void {
  if (!isRecord(value)) throw new Error('游戏状态缺少 profile')
  assertString(value.username, 'profile.username')
  assertNumber(value.generation, 'profile.generation')
  if (!Array.isArray(value.achievements)) {
    throw new Error('profile.achievements 必须是数组')
  }
  assertString(value.friendCode, 'profile.friendCode')
}

function validateRecords(value: unknown): void {
  if (!isRecord(value)) throw new Error('游戏状态缺少 records')
  for (const key of [
    'mealsFed',
    'snacksFed',
    'bathsTaken',
    'toiletsUsed',
    'sleepsStarted',
    'gamesPlayed',
    'schoolLessons',
    'shopPurchases',
    'plantsHarvested',
    'birthdays',
    'deaths',
    'revives',
    'socialPosts',
    'craftsCompleted',
    'arcadeRuns',
    'workShifts',
    'vacations',
  ]) {
    assertNumber(value[key], `records.${key}`)
  }
}

function validateSettings(value: unknown): void {
  if (!isRecord(value)) throw new Error('游戏状态缺少 settings')

  assertBoolean(value.notificationsEnabled, 'settings.notificationsEnabled')
  assertBoolean(value.reducedMotion, 'settings.reducedMotion')
  assertBoolean(value.soundEnabled, 'settings.soundEnabled')
  assertBoolean(value.fastHatch, 'settings.fastHatch')
  assertMember(value.theme, themeNames, 'settings.theme')
  assertBoolean(value.pwaUpdateAvailable, 'settings.pwaUpdateAvailable')
}

function validateFeatureFlags(value: unknown): void {
  if (!isRecord(value)) throw new Error('游戏状态缺少 featureFlags')
  assertBoolean(value.onlineHub, 'featureFlags.onlineHub')
  assertBoolean(value.social, 'featureFlags.social')
  assertBoolean(value.mods, 'featureFlags.mods')
}

function validateSocial(value: unknown): void {
  if (!isRecord(value)) throw new Error('游戏状态缺少 social')
  if (!Array.isArray(value.posts)) throw new Error('social.posts 必须是数组')
  assertString(value.draft, 'social.draft')
}

function validateMockOnline(value: unknown): void {
  if (!isRecord(value)) throw new Error('游戏状态缺少 mockOnline')
  if (!Array.isArray(value.pets)) throw new Error('mockOnline.pets 必须是数组')
  if (!Array.isArray(value.interactions)) {
    throw new Error('mockOnline.interactions 必须是数组')
  }
}

function validateCatalogs(value: unknown): void {
  if (!isRecord(value)) throw new Error('游戏状态缺少 catalogs')
  for (const key of [
    'shop',
    'craft',
    'activities',
    'minigames',
    'evolutions',
  ]) {
    if (!Array.isArray(value[key])) {
      throw new Error(`catalogs.${key} 必须是数组`)
    }
  }
}

function validateInventory(value: unknown, name: string): void {
  if (!Array.isArray(value)) {
    throw new Error(`${name} 必须是数组`)
  }

  for (const item of value) {
    if (!isRecord(item)) throw new Error(`${name} 条目必须是对象`)
    assertString(item.id, `${name}.id`)
    assertNumber(item.quantity, `${name}.quantity`)
  }
}

function validateSkills(value: unknown): void {
  if (!isRecord(value)) throw new Error('pet.skills 必须是对象')
  assertPercent(value.expression, 'pet.skills.expression')
  assertPercent(value.logic, 'pet.skills.logic')
  assertPercent(value.endurance, 'pet.skills.endurance')
}

function inventoryOr(value: unknown, fallback: GameState['resources']['food']) {
  if (!Array.isArray(value)) return fallback
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== 'string') return []
    return [{ id: item.id, quantity: finiteNumberOr(item.quantity, 0) }]
  })
}

function skillsOr(value: unknown): GameState['pet']['skills'] {
  const skills = isRecord(value) ? value : {}
  return {
    expression: percentOr(skills.expression, 0),
    logic: percentOr(skills.logic, 0),
    endurance: percentOr(skills.endurance, 0),
  }
}

function misbehaviorOr(value: unknown): GameState['pet']['misbehavior'] {
  const misbehavior = isRecord(value) ? value : {}
  return {
    active: booleanOr(misbehavior.active, false),
    kind:
      misbehavior.kind === 'mess' ||
      misbehavior.kind === 'tantrum' ||
      misbehavior.kind === 'refuse'
        ? misbehavior.kind
        : 'none',
    startedAt: numberOrNullOr(misbehavior.startedAt, null),
  }
}

function equippedAccessoriesOr(
  value: unknown
): GameState['pet']['equippedAccessories'] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!isRecord(item)) return []
    if (!accessorySlots.has(item.slot as AccessorySlot)) return []
    if (typeof item.itemId !== 'string') return []
    return [{ slot: item.slot as AccessorySlot, itemId: item.itemId }]
  })
}

function furniturePlacementsOr(
  value: unknown
): GameState['world']['furniturePlacements'] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!isRecord(item)) return []
    if (
      typeof item.id !== 'string' ||
      typeof item.itemId !== 'string' ||
      typeof item.x !== 'number' ||
      typeof item.y !== 'number'
    ) {
      return []
    }
    return [{ id: item.id, itemId: item.itemId, x: item.x, y: item.y }]
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function assertString(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`${name} 必须是字符串`)
  }
}

function assertBoolean(value: unknown, name: string): asserts value is boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${name} 必须是布尔值`)
  }
}

function assertNumber(value: unknown, name: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${name} 必须是有限数字`)
  }
}

function assertNumberOrNull(
  value: unknown,
  name: string
): asserts value is number | null {
  if (value !== null) assertNumber(value, name)
}

function assertPercent(value: unknown, name: string): asserts value is number {
  assertNumber(value, name)
  if (value < 0 || value > 100) {
    throw new Error(`${name} 必须在 0 到 100 之间`)
  }
}

function assertMember<T extends string>(
  value: unknown,
  options: ReadonlySet<T>,
  name: string
): asserts value is T {
  if (typeof value !== 'string' || !options.has(value as T)) {
    throw new Error(`${name} 的值不受支持`)
  }
}

function finiteNumberOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback
}

function booleanOr(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function numberOrNullOr(value: unknown, fallback: number | null) {
  return value === null || typeof value === 'number' ? value : fallback
}

function percentOr(value: unknown, fallback: number) {
  const number = finiteNumberOr(value, fallback)
  return Math.min(100, Math.max(0, number))
}

function memberOr<T extends string>(
  value: unknown,
  options: ReadonlySet<T>,
  fallback: T
) {
  return typeof value === 'string' && options.has(value as T)
    ? (value as T)
    : fallback
}

function stringArrayOr(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback
  return value.filter((item): item is string => typeof item === 'string')
}

function createFriendCode(seed: number) {
  return `TK-${Math.abs(Math.trunc(seed)).toString(36).slice(-6).padStart(6, '0')}`
}
