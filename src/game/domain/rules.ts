// 领域规则的统一出口：应用层只依赖这里，不直接绑定具体规则文件布局。
export {
  applyActivityCompletion,
  applyCarePressure,
  applyDailyMissionReset,
  applyDeath,
  applyEvolution,
  applyGardenProgress,
  applyHealthPressure,
  applyMood,
  applyNaturalDecay,
  applyPoopGeneration,
  applySicknessPressure,
  applySleep,
  applyWantAndMisbehavior,
  deriveNextStageForMvp,
  incrementAge,
} from './rules/lifecycle'
export { interactionRegistry } from './rules/interactions'
export * as activityRules from './rules/activities'
export * as deathRules from './rules/death'
export * as gardenRules from './rules/garden'
export * as growthRules from './rules/growth'
export * as missionRules from './rules/missions'
export * as needsRules from './rules/needs'
