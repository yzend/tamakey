export const GAME_VERSION = 1
export const SAVE_SCHEMA_VERSION = 3

export const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000

export const STAT_MIN = 0
export const STAT_MAX = 100

export const POOP_INTERVAL_SECONDS = 3 * 60 * 60
export const MAX_POOP_COUNT = 5

export const HUNGER_DECAY_PER_HOUR = 12
export const HAPPINESS_DECAY_PER_HOUR = 8
export const CLEANLINESS_DECAY_PER_HOUR = 6
export const BLADDER_FILL_PER_HOUR = 18
export const SLEEPING_ENERGY_GAIN_PER_HOUR = 25
export const AWAKE_ENERGY_DECAY_PER_HOUR = 6

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

export const EVOLUTION_THRESHOLDS_SECONDS = {
  egg: 3 * 60,
  baby: 30 * 60,
  child: 24 * 60 * 60,
} as const

export const ACTIVITY_DURATION_SECONDS = 12
export const GARDEN_GROW_SECONDS = 30 * 60
export const GARDEN_WITHER_SECONDS = 8 * 60 * 60
export const DAILY_MISSION_SECONDS = 24 * 60 * 60

export const WANT_DURATION_SECONDS = 45 * 60
export const MISBEHAVIOR_CHECK_SECONDS = 2 * 60 * 60
export const VACATION_DURATION_SECONDS = 6 * 60 * 60
