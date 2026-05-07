// 渲染模块：根据成长阶段、心情和状态选择宠物动画。
import type { PetStage, PetViewModel } from './viewModels'

export type AnimationName =
  | 'egg_idle'
  | 'egg_hatch'
  | 'baby_idle'
  | 'baby_happy'
  | 'baby_sad'
  | 'child_idle'
  | 'child_happy'
  | 'child_sad'
  | 'adult_idle'
  | 'adult_happy'
  | 'adult_sad'
  | 'pet_eat'
  | 'pet_play'
  | 'pet_sleep'
  | 'pet_sick'
  | 'pet_dead'

export type PetRendererAnimationName = AnimationName | 'pet_clean'

export function chooseAnimation(viewModel: PetViewModel): AnimationName {
  if (viewModel.stage === 'dead') return 'pet_dead'
  if (viewModel.stage === 'egg') return 'egg_idle'
  if (viewModel.sleepState === 'sleeping') return 'pet_sleep'
  if (viewModel.sickness !== 'none') return 'pet_sick'

  if (viewModel.mood === 'happy') {
    return resolveStageAnimation(viewModel.stage, 'happy')
  }

  if (
    viewModel.mood === 'sad' ||
    viewModel.mood === 'angry' ||
    viewModel.mood === 'sleepy'
  ) {
    return resolveStageAnimation(viewModel.stage, 'sad')
  }

  if (viewModel.mood === 'sick') return 'pet_sick'
  if (viewModel.mood === 'sleeping') return 'pet_sleep'

  return resolveStageAnimation(viewModel.stage, 'idle')
}

export function resolveStageAnimation(
  stage: PetStage,
  suffix: 'idle' | 'happy' | 'sad'
): AnimationName {
  if (stage === 'child' || stage === 'teen') {
    return `child_${suffix}`
  }

  if (stage === 'adult' || stage === 'elder') {
    return `adult_${suffix}`
  }

  return `baby_${suffix}`
}

export function chooseOneShotAnimation(
  interaction: string,
  stage: PetStage = 'baby'
): PetRendererAnimationName | null {
  if (interaction === 'feedMeal' || interaction === 'feedSnack') {
    return 'pet_eat'
  }

  if (
    interaction === 'play' ||
    interaction === 'startMinigame' ||
    interaction === 'finishMinigame'
  ) {
    return 'pet_play'
  }

  if (
    interaction === 'clean' ||
    interaction === 'bath' ||
    interaction === 'brushTeeth'
  ) {
    return 'pet_clean'
  }

  if (interaction === 'pet' || interaction === 'praise') {
    return resolveStageAnimation(stage, 'happy')
  }

  if (interaction === 'scold') {
    return resolveStageAnimation(stage, 'sad')
  }

  return null
}
