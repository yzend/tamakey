import { applyDeath, interactionRegistry } from '../domain/rules'
import type {
  GameCommand,
  GameState,
  InteractionResult,
  InteractionType,
} from '../domain/gameTypes'

const INVALID_INTERACTION_REASON = '当前状态不允许这个互动'

export function applyInteraction(
  state: GameState,
  interaction: InteractionType | GameCommand,
  now: number
): InteractionResult {
  const command =
    typeof interaction === 'string' ? { type: interaction } : interaction
  const handler = interactionRegistry[command.type]

  if (!handler || !handler.canApply(state, command)) {
    return {
      state,
      events: [
        {
          type: 'invalidInteraction',
          interaction: command.type,
          reason: INVALID_INTERACTION_REASON,
          at: now,
        },
      ],
    }
  }

  const result = handler.apply(state, { now, command })
  const events = [...result.events]
  const nextState = applyDeath(result.state, events, now)

  return {
    state: nextState,
    events: [
      ...events,
      {
        type: 'interactionApplied',
        interaction: command.type,
        at: now,
      },
    ],
  }
}
