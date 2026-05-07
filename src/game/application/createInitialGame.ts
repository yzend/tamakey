import {
  DAILY_MISSION_SECONDS,
  GAME_VERSION,
  SAVE_SCHEMA_VERSION,
} from '../domain/constants'
import type {
  ActivityDefinition,
  CraftRecipe,
  EvolutionRule,
  GameState,
  MinigameAdapter,
  MissionState,
  MockOnlinePet,
  ShopCatalogItem,
  WantState,
} from '../domain/gameTypes'

type InitialGameOptions = {
  caretakerName?: string
  petName?: string
}

export function createInitialGame(
  now: number,
  options: InitialGameOptions = {}
): GameState {
  return {
    version: GAME_VERSION,
    schemaVersion: SAVE_SCHEMA_VERSION,
    pet: {
      id: crypto.randomUUID(),
      name: sanitizeInitialName(options.petName, 'Tamakey'),
      species: 'starter',
      stage: 'egg',
      mood: 'idle',
      ageSeconds: 0,
      hunger: 0,
      happiness: 60,
      cleanliness: 100,
      bladder: 0,
      energy: 80,
      health: 100,
      discipline: 20,
      care: 50,
      deathSafety: 100,
      sickness: 'none',
      sleepState: 'awake',
      careMistakes: 0,
      traits: ['gentle'],
      skills: {
        expression: 0,
        logic: 0,
        endurance: 0,
      },
      want: createWant(now, 'play'),
      misbehavior: {
        active: false,
        kind: 'none',
        startedAt: null,
      },
      atParents: false,
      onVacation: false,
      equippedAccessories: [],
      bornAt: now,
      hatchedAt: null,
      lastBirthdayAt: null,
      lastInteractionAt: now,
    },
    resources: {
      coins: 25,
      food: [{ id: 'basic-meal', quantity: 5 }],
      items: [{ id: 'soap', quantity: 2 }],
      seeds: [{ id: 'sprout-seed', quantity: 2 }],
      furniture: [],
      accessories: [],
      medicine: 2,
      materials: [{ id: 'soft-fiber', quantity: 2 }],
    },
    world: {
      sceneId: 'home',
      activity: null,
      poopCount: 0,
      roomId: 'default',
      digestionSeconds: 0,
      furniture: [],
      furniturePlacements: [],
      weather: 'clear',
    },
    carePressure: {
      hungrySeconds: 0,
      dirtySeconds: 0,
      sickSeconds: 0,
      neglectSeconds: 0,
    },
    missions: {
      dailySeed: createDailySeed(now),
      resetAt: now + DAILY_MISSION_SECONDS * 1000,
      points: 0,
      list: createInitialMissions(),
    },
    garden: {
      plots: [createPlot('plot-1'), createPlot('plot-2'), createPlot('plot-3')],
      harvests: [],
      animals: [
        {
          id: 'bird-1',
          species: 'helper-bird',
          happiness: 50,
          fedAt: null,
        },
      ],
      weather: 'clear',
      buffUntil: null,
    },
    profile: {
      username: sanitizeInitialName(options.caretakerName, '本地照护者'),
      generation: 1,
      achievements: [],
      friendCode: createFriendCode(now),
    },
    friends: [],
    social: {
      posts: [],
      draft: '',
    },
    mockOnline: {
      pets: createMockOnlinePets(now),
      interactions: [],
    },
    catalogs: {
      shop: createShopCatalog(),
      craft: createCraftRecipes(),
      activities: createActivityDefinitions(),
      minigames: createMinigames(),
      evolutions: createEvolutionRules(),
    },
    records: {
      mealsFed: 0,
      snacksFed: 0,
      bathsTaken: 0,
      toiletsUsed: 0,
      sleepsStarted: 0,
      gamesPlayed: 0,
      schoolLessons: 0,
      shopPurchases: 0,
      plantsHarvested: 0,
      birthdays: 0,
      deaths: 0,
      revives: 0,
      socialPosts: 0,
      craftsCompleted: 0,
      arcadeRuns: 0,
      workShifts: 0,
      vacations: 0,
    },
    settings: {
      notificationsEnabled: false,
      reducedMotion: false,
      soundEnabled: true,
      fastHatch: false,
      theme: 'classic',
      pwaUpdateAvailable: false,
    },
    featureFlags: {
      onlineHub: false,
      social: false,
      mods: false,
    },
    ui: {
      displayStack: [],
      lastToast: null,
    },
    createdAt: now,
    lastTickAt: now,
    lastSavedAt: null,
  }
}

function sanitizeInitialName(value: string | undefined, fallback: string) {
  const normalized = value?.replace(/\s+/g, ' ').trim() ?? ''
  if (!normalized) return fallback

  return normalized.slice(0, 16)
}

export function createInitialMissions(): MissionState[] {
  return [
    {
      id: 'firstMeal',
      label: '提供一份正餐',
      progress: 0,
      goal: 1,
      rewardCoins: 8,
      claimed: false,
    },
    {
      id: 'cleanHome',
      label: '打扫房间',
      progress: 0,
      goal: 1,
      rewardCoins: 10,
      claimed: false,
    },
    {
      id: 'dailyCare',
      label: '完成三次照护',
      progress: 0,
      goal: 3,
      rewardCoins: 12,
      claimed: false,
    },
    {
      id: 'gardenStart',
      label: '种下一颗种子',
      progress: 0,
      goal: 1,
      rewardCoins: 10,
      claimed: false,
    },
    {
      id: 'schoolDay',
      label: '参加学校课程',
      progress: 0,
      goal: 1,
      rewardCoins: 14,
      claimed: false,
    },
    {
      id: 'firstFriend',
      label: '添加一位本地好友',
      progress: 0,
      goal: 1,
      rewardCoins: 16,
      claimed: false,
    },
    {
      id: 'craftDecor',
      label: '合成房间装饰',
      progress: 0,
      goal: 1,
      rewardCoins: 18,
      claimed: false,
    },
    {
      id: 'socialPost',
      label: '发布一条本地动态',
      progress: 0,
      goal: 1,
      rewardCoins: 12,
      claimed: false,
    },
    {
      id: 'arcadeRun',
      label: '试玩一次街机游戏',
      progress: 0,
      goal: 1,
      rewardCoins: 10,
      claimed: false,
    },
  ]
}

function createPlot(id: string) {
  return {
    id,
    cropId: null,
    plantedAt: null,
    wateredAt: null,
    readyAt: null,
    witheredAt: null,
  }
}

function createDailySeed(now: number) {
  return new Date(now).toISOString().slice(0, 10)
}

function createWant(now: number, kind: WantState['kind']): WantState {
  return {
    id: `want-${now}`,
    kind,
    label: kind === 'play' ? '想要玩耍' : `想要${formatWantKind(kind)}`,
    expiresAt: now + 45 * 60 * 1000,
    completedAt: null,
  }
}

function formatWantKind(kind: WantState['kind']) {
  const labels: Record<WantState['kind'], string> = {
    clean: '清洁',
    discipline: '纪律',
    food: '食物',
    garden: '花园',
    play: '玩耍',
    social: '社交',
  }
  return labels[kind]
}

function createFriendCode(now: number) {
  return `LOCAL-${Math.abs(now).toString(36).slice(-5).toUpperCase()}`
}

function createMockOnlinePets(now: number): MockOnlinePet[] {
  return [
    {
      id: 'mock-pet-1',
      name: '皮皮',
      stage: 'child',
      mood: 'happy',
      owner: '模拟好友甲',
      lastSeenAt: now,
    },
    {
      id: 'mock-pet-2',
      name: '米索',
      stage: 'adult',
      mood: 'curious',
      owner: '模拟好友乙',
      lastSeenAt: now - 3_600_000,
    },
  ]
}

function createShopCatalog(): ShopCatalogItem[] {
  return [
    {
      id: 'basic-meal',
      label: '便携正餐',
      kind: 'food',
      price: 6,
      effect: { hunger: -25, happiness: 2 },
    },
    {
      id: 'sprout-seed',
      label: '嫩芽种子',
      kind: 'seed',
      price: 10,
    },
    {
      id: 'round-chair',
      label: '圆椅',
      kind: 'furniture',
      price: 18,
    },
    {
      id: 'star-pin',
      label: '星星胸针',
      kind: 'accessory',
      price: 14,
    },
    {
      id: 'soft-fiber',
      label: '柔软纤维',
      kind: 'material',
      price: 8,
    },
  ]
}

function createCraftRecipes(): CraftRecipe[] {
  return [
    {
      id: 'leaf-rug',
      label: '叶子地毯',
      cost: [
        { id: 'sprout-harvest', quantity: 1 },
        { id: 'soft-fiber', quantity: 1 },
      ],
      output: { id: 'leaf-rug', quantity: 1 },
      outputBucket: 'furniture',
    },
    {
      id: 'garden-badge',
      label: '花园徽章',
      cost: [{ id: 'sprout-harvest', quantity: 1 }],
      output: { id: 'garden-badge', quantity: 1 },
      outputBucket: 'accessories',
    },
  ]
}

function createActivityDefinitions(): ActivityDefinition[] {
  return [
    {
      id: 'school',
      label: '学校',
      durationSeconds: 12,
      sceneId: 'school',
      rewardCoins: 6,
    },
    {
      id: 'arcade',
      label: '街机',
      durationSeconds: 10,
      sceneId: 'arcade',
      rewardCoins: 8,
    },
    {
      id: 'work',
      label: '打工',
      durationSeconds: 14,
      sceneId: 'work',
      rewardCoins: 16,
    },
    {
      id: 'garden',
      label: '花园',
      durationSeconds: 8,
      sceneId: 'garden',
      rewardCoins: 0,
    },
    {
      id: 'vacation',
      label: '度假',
      durationSeconds: 30,
      sceneId: 'vacation',
      rewardCoins: 0,
    },
  ]
}

function createMinigames(): MinigameAdapter[] {
  return [
    {
      id: 'card-match',
      label: '卡牌配对',
      rewardCoins: 12,
      skill: 'logic',
    },
    {
      id: 'dance-step',
      label: '舞步练习',
      rewardCoins: 10,
      skill: 'expression',
    },
  ]
}

function createEvolutionRules(): EvolutionRule[] {
  return [
    { from: 'baby', to: 'child', minAgeSeconds: 30 * 60 },
    { from: 'child', to: 'teen', minAgeSeconds: 24 * 60 * 60, minCare: 40 },
    {
      from: 'teen',
      to: 'adult',
      minAgeSeconds: 3 * 24 * 60 * 60,
      minSkill: 'logic',
    },
    {
      from: 'adult',
      to: 'elder',
      minAgeSeconds: 7 * 24 * 60 * 60,
      minCare: 50,
    },
  ]
}
