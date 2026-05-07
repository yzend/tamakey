export const GAME_VERSION = 1
export const SAVE_SCHEMA_VERSION = 3

// 离线结算最多模拟 24 小时，避免长时间未打开游戏时一次性扣空状态。
export const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000

// 宠物数值统一使用 0-100 区间，规则层通过 clamp 保证不会越界。
export const STAT_MIN = 0
export const STAT_MAX = 100

// 排泄物生成规则：随消化计时累积，同时限制场景里最多保留的数量。
export const POOP_INTERVAL_SECONDS = 3 * 60 * 60
export const MAX_POOP_COUNT = 5

// 自然衰减速率按小时计算，推进时间时会按 deltaSeconds 折算。
export const HUNGER_DECAY_PER_HOUR = 12
export const HAPPINESS_DECAY_PER_HOUR = 8
export const CLEANLINESS_DECAY_PER_HOUR = 6
export const BLADDER_FILL_PER_HOUR = 18
export const SLEEPING_ENERGY_GAIN_PER_HOUR = 25
export const AWAKE_ENERGY_DECAY_PER_HOUR = 6

// 压力阈值用于把短期需求不足转成生病、掉血或死亡风险。
export const HUNGRY_THRESHOLD = 85
export const DIRTY_CLEANLINESS_THRESHOLD = 20
export const DIRTY_POOP_THRESHOLD = 3
export const MILD_SICKNESS_AFTER_SECONDS = 3 * 60 * 60
export const SEVERE_SICKNESS_AFTER_SECONDS = 6 * 60 * 60
export const HEALTH_LOSS_HUNGER_AFTER_SECONDS = 4 * 60 * 60
export const NEGLECT_DEATH_AFTER_SECONDS = 10 * 60 * 60

export const HUNGER_HEALTH_LOSS_PER_HOUR = 8
export const MILD_SICKNESS_HEALTH_LOSS_PER_HOUR = 3
export const SEVERE_SICKNESS_HEALTH_LOSS_PER_HOUR = 10

// MVP 成长阶段只依赖年龄和 fastHatch 开关，复杂进化条件保留在目录类型中。
export const EVOLUTION_THRESHOLDS_SECONDS = {
  egg: 3 * 60,
  baby: 30 * 60,
  child: 24 * 60 * 60,
} as const

// 短活动和花园沿用统一时长，方便测试和 UI 进度条复用。
export const ACTIVITY_DURATION_SECONDS = 12
export const GARDEN_GROW_SECONDS = 30 * 60
export const GARDEN_WITHER_SECONDS = 8 * 60 * 60
export const DAILY_MISSION_SECONDS = 24 * 60 * 60

// 想要、行为问题和长时活动的时间窗口。
export const WANT_DURATION_SECONDS = 45 * 60
export const MISBEHAVIOR_CHECK_SECONDS = 2 * 60 * 60
export const VACATION_DURATION_SECONDS = 6 * 60 * 60
