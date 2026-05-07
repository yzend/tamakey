// 宠物生命阶段从蛋到死亡，领域规则会根据年龄或玩家操作推进。
export type PetStage =
  | 'egg'
  | 'baby'
  | 'child'
  | 'teen'
  | 'adult'
  | 'elder'
  | 'dead'

// 心情是渲染层和提示文案的派生输入，优先级在 applyMood 中统一计算。
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

// 背包条目只存 id 和数量，物品定义来自 catalog 或本地模组。
export type InventoryItem = {
  // 物品或资源在目录中的唯一标识。
  id: string
  // 当前持有数量，规则层会在扣到 0 时移除条目。
  quantity: number
}

// 菜单和场景 id 是 UI 与领域交互之间的稳定协议。
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

// 场景 id 会影响渲染背景，也用于活动开始和结束后的落点。
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

// 活动 id 表示会锁定宠物的一段时间任务。
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
  // 正在执行的活动类型。
  id: ActivityId
  // 活动开始时间戳，单位为毫秒。
  startedAt: number
  // 活动结束时间戳，单位为毫秒。
  endsAt: number
  // 是否锁定玩家输入，锁定时不能执行普通照护。
  locked: boolean
}

// 任务进度只记录可结算状态，具体触发点由交互和生命周期规则写入。
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
  // 任务唯一标识，用于进度更新和奖励领取。
  id: MissionId
  // 展示给玩家的任务名称。
  label: string
  // 当前完成进度。
  progress: number
  // 领取奖励所需目标进度。
  goal: number
  // 任务完成后可领取的金币数。
  rewardCoins: number
  // 是否已经领取过奖励。
  claimed: boolean
}

// 花园地块用时间戳描述生命周期：种植、浇水、成熟和枯萎。
export type GardenPlotState = {
  // 地块唯一标识，用于命令定位目标地块。
  id: string
  // 当前作物 id；null 表示空地，withered 表示已枯萎。
  cropId: string | null
  // 种植时间戳，单位为毫秒。
  plantedAt: number | null
  // 最近一次浇水时间戳，单位为毫秒。
  wateredAt: number | null
  // 作物可收获时间戳，未成熟时为 null。
  readyAt: number | null
  // 作物枯萎时间戳，未进入可收获窗口时为 null。
  witheredAt: number | null
}

export type GardenState = {
  // 花园里的所有地块状态。
  plots: GardenPlotState[]
  // 花园系统内部的收获篮，烹饪和合成可读取这里。
  harvests: InventoryItem[]
  // 花园动物助手状态。
  animals: AnimalState[]
  // 当前花园天气。
  weather: WeatherState
  // 花园增益失效时间戳，没有增益时为 null。
  buffUntil: number | null
}

// 宠物想要是短期目标，完成后会额外提升快乐和照护值。
export type WantState = {
  // 想要实例 id，通常包含生成时间。
  id: string
  // 想要的类别，决定哪些交互可以完成它。
  kind: 'food' | 'play' | 'clean' | 'discipline' | 'garden' | 'social'
  // 展示给玩家的想要描述。
  label: string
  // 可选目标 id，例如指定食物、地块或社交对象。
  targetId?: string
  // 过期时间戳，超过后会生成新的想要。
  expiresAt: number
  // 完成时间戳；null 表示尚未完成。
  completedAt: number | null
}

export type MisbehaviorState = {
  // 当前是否正在发生行为问题。
  active: boolean
  // 行为问题类型；none 表示没有具体问题。
  kind: 'mess' | 'tantrum' | 'refuse' | 'none'
  // 行为问题开始时间戳。
  startedAt: number | null
}

// 技能用于小游戏、学校和未来进化分支。
export type SkillSet = {
  // 表达力技能，主要由烹饪或表达类活动提升。
  expression: number
  // 逻辑技能，主要由小游戏或学习类活动提升。
  logic: number
  // 耐力技能，预留给工作、运动或长活动。
  endurance: number
}

export type FamilyEntry = {
  // 家族成员唯一标识。
  id: string
  // 家族成员名字。
  name: string
  // 离开家庭时的生命阶段。
  stage: PetStage
  // 所属世代编号。
  generation: number
  // 搬出时间戳。
  movedOutAt: number
}

export type FriendState = {
  // 好友唯一标识。
  id: string
  // 好友展示名称。
  name: string
  // 好友码，用于添加或展示关系来源。
  code: string
  // 友好度数值，范围按 0-100 处理。
  friendship: number
  // 添加好友的时间戳。
  addedAt: number
}

export type SocialPost = {
  // 动态唯一标识。
  id: string
  // 发布者名称。
  author: string
  // 动态正文，已在写入前做安全清洗。
  body: string
  // 发布时间戳。
  createdAt: number
  // 点赞数量。
  likes: number
  // 是否为本地模拟动态。
  local: boolean
}

export type MockOnlinePet = {
  // 模拟在线宠物唯一标识。
  id: string
  // 模拟宠物名称。
  name: string
  // 模拟宠物生命阶段。
  stage: PetStage
  // 模拟宠物当前心情。
  mood: PetMood
  // 模拟宠物主人名称。
  owner: string
  // 最近刷新或出现的时间戳。
  lastSeenAt: number
}

export type MockOnlineState = {
  // 当前在线大厅展示的模拟宠物列表。
  pets: MockOnlinePet[]
  // 玩家对模拟在线宠物发出的互动记录。
  interactions: Array<{
    // 互动记录唯一标识。
    id: string
    // 被互动的模拟宠物 id。
    petId: string
    // 互动动作名称。
    action: string
    // 互动创建时间戳。
    createdAt: number
  }>
}

export type ShopCatalogItem = {
  // 商品唯一标识。
  id: string
  // 商品展示名称。
  label: string
  // 商品分类，决定购买后进入哪个资源桶。
  kind: 'food' | 'seed' | 'medicine' | 'furniture' | 'accessory' | 'material'
  // 商品价格，单位为金币。
  price: number
  // 可选即时效果，主要用于食物或药品类商品。
  effect?: Partial<Pick<PetState, 'hunger' | 'happiness' | 'energy' | 'health'>>
}

export type CraftRecipe = {
  // 合成配方唯一标识。
  id: string
  // 合成配方展示名称。
  label: string
  // 合成所需材料列表。
  cost: InventoryItem[]
  // 合成产出物品和数量。
  output: InventoryItem
  // 产出写入的资源桶。
  outputBucket: 'items' | 'furniture' | 'accessories' | 'food'
}

export type FurniturePlacement = {
  // 摆放实例唯一标识，不等同于家具物品 id。
  id: string
  // 被摆放的家具物品 id。
  itemId: string
  // 房间内横向坐标。
  x: number
  // 房间内纵向坐标。
  y: number
}

export type AccessorySlot = 'head' | 'face' | 'body'

export type EquippedAccessory = {
  // 饰品装备槽位。
  slot: AccessorySlot
  // 当前槽位装备的饰品物品 id。
  itemId: string
}

export type AnimalState = {
  // 花园动物唯一标识。
  id: string
  // 花园动物种类。
  species: 'helper-bird' | 'garden-cat'
  // 动物快乐值，影响后续增益扩展。
  happiness: number
  // 最近喂食时间戳。
  fedAt: number | null
}

export type WeatherState = 'clear' | 'rain' | 'wind'

export type EvolutionRule = {
  // 规则适用的起始阶段。
  from: PetStage
  // 满足条件后进化到的目标阶段。
  to: PetStage
  // 触发进化所需最小年龄，单位为秒。
  minAgeSeconds: number
  // 可选最小照护值要求。
  minCare?: number
  // 可选技能要求，表示需要重点检查的技能项。
  minSkill?: keyof SkillSet
}

// 目录活动定义由初始数据或模组补充，运行时会落成 ActiveActivity。
export type ActivityDefinition = {
  // 活动唯一标识。
  id: ActivityId
  // 活动展示名称。
  label: string
  // 活动持续时间，单位为秒。
  durationSeconds: number
  // 活动开始后切换到的场景。
  sceneId: SceneId
  // 活动完成后奖励金币数。
  rewardCoins: number
}

export type MinigameAdapter = {
  // 小游戏唯一标识。
  id: string
  // 小游戏展示名称。
  label: string
  // 完成小游戏的基础奖励金币数。
  rewardCoins: number
  // 小游戏主要提升的技能。
  skill: keyof SkillSet
}

export type ProfileState = {
  // 玩家展示名。
  username: string
  // 当前宠物世代。
  generation: number
  // 已获得成就 id 列表。
  achievements: string[]
  // 本地好友码。
  friendCode: string
}

// 记录字段服务于成就、统计面板和部分测试断言。
export type RecordState = {
  // 喂正餐次数。
  mealsFed: number
  // 喂零食次数。
  snacksFed: number
  // 洗澡或清洁宠物次数。
  bathsTaken: number
  // 使用厕所次数。
  toiletsUsed: number
  // 开始睡眠次数。
  sleepsStarted: number
  // 游玩次数。
  gamesPlayed: number
  // 完成学校课程次数。
  schoolLessons: number
  // 商店购买次数。
  shopPurchases: number
  // 收获植物次数。
  plantsHarvested: number
  // 手动生日成长次数。
  birthdays: number
  // 宠物死亡次数。
  deaths: number
  // 复活次数。
  revives: number
  // 发布社交动态次数。
  socialPosts: number
  // 完成合成次数。
  craftsCompleted: number
  // 街机小游戏完成次数。
  arcadeRuns: number
  // 打工完成次数。
  workShifts: number
  // 开始度假次数。
  vacations: number
}

export type UiState = {
  // 当前打开的菜单栈，最后一个元素是最上层菜单。
  displayStack: MenuId[]
  // 最近一次展示给玩家的 toast 文案。
  lastToast: string | null
}

// 核心宠物状态只放领域属性，渲染状态和输入状态不写入这里。
export type PetState = {
  // 宠物唯一标识，换新蛋时会重新生成。
  id: string
  // 宠物名称。
  name: string
  // 宠物品种或外观族系。
  species: string
  // 当前生命阶段。
  stage: PetStage
  // 当前派生心情。
  mood: PetMood
  // 宠物年龄，单位为秒。
  ageSeconds: number
  // 饥饿压力，数值越高越饿。
  hunger: number
  // 快乐值，数值越高越开心。
  happiness: number
  // 清洁度，数值越高越干净。
  cleanliness: number
  // 如厕压力，满格后可能生成排泄物。
  bladder: number
  // 体力值，睡眠恢复，清醒消耗。
  energy: number
  // 健康值，长期饥饿或疾病会降低。
  health: number
  // 纪律值，影响行为问题触发。
  discipline: number
  // 照护值，代表长期照顾质量。
  care: number
  // 死亡安全缓冲，长期忽视会降低。
  deathSafety: number
  // 生病状态。
  sickness: SicknessState
  // 睡眠状态。
  sleepState: SleepState
  // 照护失误次数，预留给复杂进化或评价规则。
  careMistakes: number
  // 宠物特质 id 列表。
  traits: string[]
  // 宠物技能集合。
  skills: SkillSet
  // 当前短期想要，没有想要时为 null。
  want: WantState | null
  // 当前行为问题状态。
  misbehavior: MisbehaviorState
  // 是否寄养在父母家。
  atParents: boolean
  // 是否正在度假。
  onVacation: boolean
  // 已装备饰品列表。
  equippedAccessories: EquippedAccessory[]
  // 出生或新蛋创建时间戳。
  bornAt: number
  // 孵化时间戳，未孵化时为 null。
  hatchedAt: number | null
  // 最近一次生日成长时间戳。
  lastBirthdayAt: number | null
  // 最近一次玩家交互时间戳。
  lastInteractionAt: number
}

// GameState 是存档和规则推进的根对象；所有领域函数都返回新的不可变状态。
export type GameState = {
  // 游戏数据版本，用于整体兼容判断。
  version: number
  // 存档结构版本。
  schemaVersion: 3
  // 当前宠物状态。
  pet: PetState
  // 玩家资源和背包。
  resources: {
    // 当前金币数量。
    coins: number
    // 食物背包。
    food: InventoryItem[]
    // 普通物品背包。
    items: InventoryItem[]
    // 种子背包。
    seeds: InventoryItem[]
    // 家具背包。
    furniture: InventoryItem[]
    // 饰品背包。
    accessories: InventoryItem[]
    // 药品数量。
    medicine: number
    // 材料背包。
    materials: InventoryItem[]
  }
  // 当前世界和房间状态。
  world: {
    // 当前显示场景。
    sceneId: SceneId
    // 正在进行的活动，没有活动时为 null。
    activity: ActiveActivity | null
    // 房间内排泄物数量。
    poopCount: number
    // 当前房间 id，预留给多房间扩展。
    roomId: string
    // 消化累计秒数，用于周期性生成排泄物。
    digestionSeconds: number
    // 旧版家具 id 列表，保留用于兼容渲染。
    furniture: string[]
    // 家具摆放实例列表。
    furniturePlacements: FurniturePlacement[]
    // 当前世界天气。
    weather: WeatherState
  }
  // 连续照护压力计时器。
  carePressure: {
    // 连续处于饥饿状态的秒数。
    hungrySeconds: number
    // 连续处于脏污或排泄物过多状态的秒数。
    dirtySeconds: number
    // 连续处于生病状态的秒数。
    sickSeconds: number
    // 连续处于任一忽视状态的秒数。
    neglectSeconds: number
  }
  // 日常任务系统状态。
  missions: {
    // 当天任务种子，通常是日期字符串。
    dailySeed: string
    // 下一次日常任务重置时间戳。
    resetAt: number
    // 已领取任务奖励累计点数。
    points: number
    // 当前任务列表。
    list: MissionState[]
  }
  // 花园系统状态。
  garden: GardenState
  // 玩家资料状态。
  profile: ProfileState
  // 本地好友列表。
  friends: FriendState[]
  // 本地社交状态。
  social: {
    // 社交动态列表。
    posts: SocialPost[]
    // 当前未发布草稿。
    draft: string
  }
  // 模拟在线大厅状态。
  mockOnline: MockOnlineState
  // 可扩展目录数据。
  catalogs: {
    // 商店商品目录。
    shop: ShopCatalogItem[]
    // 合成配方目录。
    craft: CraftRecipe[]
    // 活动定义目录。
    activities: ActivityDefinition[]
    // 小游戏适配器目录。
    minigames: MinigameAdapter[]
    // 进化规则目录。
    evolutions: EvolutionRule[]
  }
  // 玩家累计记录。
  records: RecordState
  // 本地设置。
  settings: {
    // 是否允许通知。
    notificationsEnabled: boolean
    // 是否减少动画。
    reducedMotion: boolean
    // 是否启用声音。
    soundEnabled: boolean
    // 是否启用快速孵化。
    fastHatch: boolean
    // 当前主题名。
    theme:
      | 'classic'
      | 'mint'
      | 'contrast'
      | 'sakura'
      | 'aqua'
      | 'grape'
      | 'toyblue'
      | 'strawberry'
      | 'matcha'
    // 是否检测到 PWA 更新。
    pwaUpdateAvailable: boolean
  }
  // 功能开关。
  featureFlags: {
    // 是否启用模拟在线大厅。
    onlineHub: boolean
    // 是否启用本地社交功能。
    social: boolean
    // 是否启用本地模组导入。
    mods: boolean
  }
  // UI 临时状态。
  ui: UiState
  // 游戏创建时间戳。
  createdAt: number
  // 最近一次时间推进时间戳。
  lastTickAt: number
  // 最近一次成功保存时间戳。
  lastSavedAt: number | null
}

// 交互类型是应用层传给领域层的命令白名单。
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
  | {
      // payload 分类标识：菜单命令。
      kind: 'menu'
      // 目标菜单 id。
      menuId: MenuId
    }
  | {
      // payload 分类标识：活动命令。
      kind: 'activity'
      // 目标活动 id。
      activityId: ActivityId
      // 可选活动结果，用于小游戏或活动结算。
      result?: 'win' | 'lose'
    }
  | {
      // payload 分类标识：背包命令。
      kind: 'inventory'
      // 目标物品 id。
      itemId: string
      // 可选资源桶，用于指定从哪个背包读写。
      bucket?: keyof GameState['resources']
    }
  | {
      // payload 分类标识：花园命令。
      kind: 'garden'
      // 目标地块 id。
      plotId: string
      // 可选种子 id。
      seedId?: string
      // 可选动物 id。
      animalId?: string
    }
  | {
      // payload 分类标识：设置命令。
      kind: 'settings'
      // 要修改的设置字段。
      key: keyof GameState['settings']
      // 设置的新值。
      value: boolean | string
    }
  | {
      // payload 分类标识：功能开关命令。
      kind: 'feature'
      // 要修改的功能开关字段。
      key: keyof GameState['featureFlags']
      // 功能开关的新值。
      value: boolean
    }
  | {
      // payload 分类标识：社交命令。
      kind: 'social'
      // 可选动态 id。
      postId?: string
      // 可选动态正文。
      body?: string
      // 可选好友码。
      friendCode?: string
    }
  | {
      // payload 分类标识：资料命令。
      kind: 'profile'
      // 新玩家名。
      username: string
    }
  | {
      // payload 分类标识：在线互动命令。
      kind: 'online'
      // 可选模拟宠物 id。
      petId?: string
      // 可选互动动作。
      action?: string
    }
  | {
      // payload 分类标识：存档导入导出命令。
      kind: 'importExport'
      // 导入或导出的文本内容。
      text?: string
    }
  | {
      // payload 分类标识：本地模组命令。
      kind: 'mod'
      // 模组 JSON 文本。
      text: string
    }

export type GameCommand = {
  // 交互类型，决定从注册表中选择哪个处理器。
  type: InteractionType
  // 旧式目标 id，兼容没有 payload 的命令。
  targetId?: string
  // 旧式文本或布尔字符串值。
  value?: string
  // 结构化命令载荷。
  payload?: GameCommandPayload
}

// 事件是规则层对外暴露的副作用描述，应用层可据此播动画、toast 或埋点。
export type GameEvent =
  | {
      // 事件类型：宠物孵化。
      type: 'hatched'
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：宠物成长。
      type: 'evolved'
      // 成长前阶段。
      from: PetStage
      // 成长后阶段。
      to: PetStage
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：宠物复活。
      type: 'revived'
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：创建新蛋。
      type: 'newEggCreated'
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：生成排泄物。
      type: 'poopCreated'
      // 生成后的排泄物总数。
      count: number
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：宠物生病或病情升级。
      type: 'becameSick'
      // 新的生病状态。
      sickness: SicknessState
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：宠物恢复健康。
      type: 'recovered'
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：宠物死亡。
      type: 'died'
      // 死亡原因。
      reason: 'hunger' | 'sickness' | 'neglect'
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：交互已执行。
      type: 'interactionApplied'
      // 已执行的交互类型。
      interaction: InteractionType
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：想要更新。
      type: 'wantUpdated'
      // 新的想要状态；null 表示清空。
      want: WantState | null
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：行为问题状态变化。
      type: 'misbehaviorChanged'
      // 是否处于行为问题中。
      active: boolean
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：任务进度更新。
      type: 'missionUpdated'
      // 被更新的任务 id。
      missionId: MissionId
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：任务奖励领取。
      type: 'missionClaimed'
      // 被领取的任务 id。
      missionId: MissionId
      // 本次领取的奖励金币数。
      rewardCoins: number
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：活动开始。
      type: 'activityStarted'
      // 活动 id。
      activityId: ActivityId
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：活动结束。
      type: 'activityEnded'
      // 活动 id。
      activityId: ActivityId
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：存档导入成功。
      type: 'saveImported'
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：存档或模组被拒绝。
      type: 'saveRejected'
      // 拒绝原因。
      reason: string
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：模组导入成功。
      type: 'modImported'
      // 模组名称。
      name: string
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：花园地块更新。
      type: 'gardenUpdated'
      // 更新的地块 id。
      plotId: string
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：背包或物品数量变化。
      type: 'inventoryChanged'
      // 变化的物品 id。
      itemId: string
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：社交状态更新。
      type: 'socialUpdated'
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：模拟在线状态更新。
      type: 'mockOnlineUpdated'
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：错误被恢复或兼容性路径被触发。
      type: 'errorRecovered'
      // 恢复说明或诊断信息。
      message: string
      // 事件发生时间戳。
      at: number
    }
  | {
      // 事件类型：交互被拒绝。
      type: 'invalidInteraction'
      // 被拒绝的交互类型。
      interaction: InteractionType
      // 拒绝原因。
      reason: string
      // 事件发生时间戳。
      at: number
    }

export type AdvanceResult = {
  // 推进后的新游戏状态。
  state: GameState
  // 推进过程中产生的事件列表。
  events: GameEvent[]
}

export type OfflineSummary = {
  // 实际离线时长，单位为毫秒。
  elapsedMs: number
  // 实际参与模拟的时长，单位为毫秒。
  simulatedMs: number
  // 展示给玩家的离线摘要文案。
  messages: string[]
}

export type RestoreResult = {
  // 恢复后的游戏状态。
  state: GameState
  // 恢复过程中产生的事件列表。
  events: GameEvent[]
  // 离线结算摘要，没有离线结算时为 null。
  offlineSummary: OfflineSummary | null
  // 是否从损坏存档中回退到了可用状态。
  recoveredFromCorruptSave: boolean
}

export type InteractionContext = {
  // 当前交互时间戳。
  now: number
  // 原始交互命令。
  command: GameCommand
}

// 每个交互处理器先判断能否执行，再产出新状态和事件。
export type InteractionResult = {
  // 交互后的新游戏状态。
  state: GameState
  // 交互产生的事件列表。
  events: GameEvent[]
}

export type InteractionHandler = {
  // 判断命令在当前状态下是否允许执行。
  canApply(state: GameState, command: GameCommand): boolean
  // 执行命令并返回状态变化和事件。
  apply(state: GameState, context: InteractionContext): InteractionResult
}

export type InteractionRegistry = Partial<
  Record<InteractionType, InteractionHandler>
>

export type SaveData = {
  // 存档结构版本。
  schemaVersion: 3
  // 保存时间戳。
  savedAt: number
  // 游戏主体状态，不包含需要单独合并的 UI、设置和资料。
  game: Omit<GameState, 'ui' | 'settings' | 'profile'>
  // 单独保存的设置状态。
  settings: GameState['settings']
  // 单独保存的玩家资料。
  profile: GameState['profile']
}

export type LoadSaveResult =
  | {
      // 读取结果：没有可用存档。
      status: 'empty'
      // 空存档没有数据。
      data: null
    }
  | {
      // 读取结果：成功解析存档。
      status: 'ok'
      // 解析出的存档数据。
      data: SaveData
    }
  | {
      // 读取结果：存档损坏或格式不兼容。
      status: 'corrupt'
      // 损坏状态下不返回可用数据。
      data: null
      // 原始存档文本，可能读取失败而为空。
      raw: string | null
      // 解析或校验时捕获的错误。
      error: unknown
    }

export type ReminderReason =
  | 'hungry'
  | 'dirty'
  | 'sick'
  | 'lonely'
  | 'energyFull'

export type Reminder = {
  // 提醒唯一标识。
  id: string
  // 计划触发时间戳。
  at: number
  // 通知标题。
  title: string
  // 通知正文。
  body: string
  // 触发提醒的原因。
  reason: ReminderReason
}

export type ReminderPlan = {
  // 计划中的提醒列表。
  reminders: Reminder[]
}
