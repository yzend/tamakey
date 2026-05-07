import { clamp } from '../../../shared/clamp'
import {
  ACTIVITY_DURATION_SECONDS,
  EVOLUTION_THRESHOLDS_SECONDS,
  STAT_MAX,
  STAT_MIN,
} from '../constants'
import type {
  ActivityId,
  GameCommand,
  GameEvent,
  GameState,
  InteractionResult,
  InteractionRegistry,
  InventoryItem,
  MenuId,
  MissionId,
  PetStage,
} from '../gameTypes'
import { parseLocalModDefinition } from '../mods/modSandbox'
import { mockOnlineApi } from '../../services/mockOnlineApi'
import { applyMood } from './lifecycle'

const MAIN_MENUS: MenuId[] = [
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
]

const isPetCareAvailable = (state: GameState): boolean =>
  state.pet.stage !== 'egg' &&
  state.pet.stage !== 'dead' &&
  !state.world.activity

const canCareForAwakePet = (state: GameState): boolean =>
  isPetCareAvailable(state) && state.pet.sleepState === 'awake'

export const interactionRegistry: InteractionRegistry = {
  feedMeal: {
    canApply: (state) =>
      canCareForAwakePet(state) &&
      state.pet.hunger > 5 &&
      getInventoryQuantity(state.resources.food, 'basic-meal') > 0,
    apply: (state, context) =>
      withMissionProgress(
        applyMood({
          ...state,
          resources: updateInventory(state.resources, 'food', 'basic-meal', -1),
          pet: finishWant(
            {
              ...state.pet,
              hunger: clamp(state.pet.hunger - 28, STAT_MIN, STAT_MAX),
              happiness: clamp(state.pet.happiness + 3, STAT_MIN, STAT_MAX),
              energy: clamp(state.pet.energy - 2, STAT_MIN, STAT_MAX),
              care: clamp(state.pet.care + 2, STAT_MIN, STAT_MAX),
              lastInteractionAt: context.now,
            },
            'food',
            context.now
          ),
          records: {
            ...state.records,
            mealsFed: state.records.mealsFed + 1,
          },
        }),
        ['firstMeal', 'dailyCare'],
        context.now
      ),
  },
  feedSnack: {
    canApply: canCareForAwakePet,
    apply: (state, context) =>
      withMissionProgress(
        applyMood({
          ...state,
          pet: {
            ...state.pet,
            hunger: clamp(state.pet.hunger - 10, STAT_MIN, STAT_MAX),
            happiness: clamp(state.pet.happiness + 12, STAT_MIN, STAT_MAX),
            health: clamp(state.pet.health - 2, STAT_MIN, STAT_MAX),
            lastInteractionAt: context.now,
          },
          records: {
            ...state.records,
            snacksFed: state.records.snacksFed + 1,
          },
        }),
        ['dailyCare'],
        context.now
      ),
  },
  play: {
    canApply: (state) =>
      canCareForAwakePet(state) && state.pet.sickness !== 'severe',
    apply: (state, context) =>
      withMissionProgress(
        applyMood({
          ...state,
          pet: {
            ...state.pet,
            happiness: clamp(state.pet.happiness + 18, STAT_MIN, STAT_MAX),
            energy: clamp(state.pet.energy - 12, STAT_MIN, STAT_MAX),
            hunger: clamp(state.pet.hunger + 8, STAT_MIN, STAT_MAX),
            lastInteractionAt: context.now,
          },
          records: {
            ...state.records,
            gamesPlayed: state.records.gamesPlayed + 1,
          },
        }),
        ['dailyCare'],
        context.now
      ),
  },
  clean: {
    canApply: (state) =>
      state.pet.stage !== 'egg' && state.pet.stage !== 'dead',
    apply: (state, context) => cleanState(state, context.now, 'cleanHome'),
  },
  bath: {
    canApply: canCareForAwakePet,
    apply: (state, context) =>
      startActivity(
        cleanState(state, context.now, 'dailyCare').state,
        'bath',
        context.now
      ),
  },
  toilet: {
    canApply: (state) =>
      canCareForAwakePet(state) &&
      (state.pet.bladder > 20 || state.world.poopCount > 0),
    apply: (state, context) =>
      startActivity(
        withMissionProgress(
          applyMood({
            ...state,
            pet: {
              ...state.pet,
              bladder: 0,
              cleanliness: clamp(
                state.pet.cleanliness + 10,
                STAT_MIN,
                STAT_MAX
              ),
              lastInteractionAt: context.now,
            },
            world: {
              ...state.world,
              poopCount: 0,
              digestionSeconds: 0,
            },
            carePressure: {
              ...state.carePressure,
              dirtySeconds: 0,
            },
            records: {
              ...state.records,
              toiletsUsed: state.records.toiletsUsed + 1,
            },
          }),
          ['dailyCare'],
          context.now
        ).state,
        'toilet',
        context.now
      ),
  },
  cleanRoom: {
    canApply: (state) =>
      state.pet.stage !== 'egg' && state.pet.stage !== 'dead',
    apply: (state, context) => cleanState(state, context.now, 'cleanHome'),
  },
  medicine: {
    canApply: (state) =>
      state.pet.stage !== 'egg' &&
      state.pet.stage !== 'dead' &&
      state.pet.sickness !== 'none' &&
      state.resources.medicine > 0,
    apply: (state, context) => {
      const sickness = state.pet.sickness === 'severe' ? 'mild' : 'none'
      const events: GameEvent[] =
        sickness === 'none' ? [{ type: 'recovered', at: context.now }] : []

      return {
        state: applyMood({
          ...state,
          resources: {
            ...state.resources,
            medicine: state.resources.medicine - 1,
          },
          pet: {
            ...state.pet,
            sickness,
            health: clamp(state.pet.health + 30, STAT_MIN, STAT_MAX),
            lastInteractionAt: context.now,
          },
          carePressure: {
            ...state.carePressure,
            sickSeconds: 0,
          },
        }),
        events,
      }
    },
  },
  brushTeeth: {
    canApply: canCareForAwakePet,
    apply: (state, context) =>
      withMissionProgress(
        applyMood({
          ...state,
          pet: {
            ...state.pet,
            cleanliness: clamp(state.pet.cleanliness + 18, STAT_MIN, STAT_MAX),
            health: clamp(state.pet.health + 3, STAT_MIN, STAT_MAX),
            lastInteractionAt: context.now,
          },
          ui: {
            ...state.ui,
            lastToast: '已经刷牙。',
          },
        }),
        ['dailyCare'],
        context.now
      ),
  },
  praise: {
    canApply: canCareForAwakePet,
    apply: (state, context) => ({
      state: applyMood({
        ...state,
        pet: {
          ...state.pet,
          discipline: clamp(state.pet.discipline + 6, STAT_MIN, STAT_MAX),
          happiness: clamp(state.pet.happiness + 5, STAT_MIN, STAT_MAX),
          care: clamp(state.pet.care + 3, STAT_MIN, STAT_MAX),
          mood: 'proud',
          lastInteractionAt: context.now,
        },
        ui: { ...state.ui, lastToast: '表扬奏效了。' },
      }),
      events: [],
    }),
  },
  scold: {
    canApply: canCareForAwakePet,
    apply: (state, context) => ({
      state: applyMood({
        ...state,
        pet: {
          ...state.pet,
          discipline: clamp(state.pet.discipline + 10, STAT_MIN, STAT_MAX),
          happiness: clamp(state.pet.happiness - 4, STAT_MIN, STAT_MAX),
          misbehavior: {
            active: false,
            kind: 'none',
            startedAt: null,
          },
          lastInteractionAt: context.now,
        },
        ui: { ...state.ui, lastToast: '已经温和批评。' },
      }),
      events: [{ type: 'misbehaviorChanged', active: false, at: context.now }],
    }),
  },
  pet: {
    canApply: canCareForAwakePet,
    apply: (state, context) =>
      withMissionProgress(
        {
          state: applyMood({
            ...state,
            pet: finishWant(
              {
                ...state.pet,
                happiness: clamp(state.pet.happiness + 10, STAT_MIN, STAT_MAX),
                care: clamp(state.pet.care + 4, STAT_MIN, STAT_MAX),
                lastInteractionAt: context.now,
              },
              'social',
              context.now
            ),
            ui: { ...state.ui, lastToast: '摸摸完成。' },
          }),
          events: [],
        },
        ['dailyCare'],
        context.now
      ),
  },
  sleep: {
    canApply: canCareForAwakePet,
    apply: (state, context) =>
      withMissionProgress(
        applyMood({
          ...state,
          pet: {
            ...state.pet,
            sleepState: 'sleeping',
            lastInteractionAt: context.now,
          },
          world: {
            ...state.world,
            sceneId: 'bedroom',
          },
          records: {
            ...state.records,
            sleepsStarted: state.records.sleepsStarted + 1,
          },
        }),
        ['dailyCare'],
        context.now
      ),
  },
  wake: {
    canApply: (state) =>
      state.pet.stage !== 'egg' &&
      state.pet.stage !== 'dead' &&
      state.pet.sleepState === 'sleeping',
    apply: (state, context) => ({
      state: applyMood({
        ...state,
        pet: {
          ...state.pet,
          sleepState: 'awake',
          lastInteractionAt: context.now,
        },
        world: {
          ...state.world,
          sceneId: 'home',
        },
      }),
      events: [],
    }),
  },
  birthday: {
    canApply: (state) =>
      isPetCareAvailable(state) &&
      state.pet.stage !== 'elder' &&
      state.pet.ageSeconds >= EVOLUTION_THRESHOLDS_SECONDS.baby,
    apply: (state, context) => {
      const next = nextManualStage(state.pet.stage)
      const events: GameEvent[] = [
        { type: 'evolved', from: state.pet.stage, to: next, at: context.now },
      ]

      return {
        state: applyMood({
          ...state,
          pet: {
            ...state.pet,
            stage: next,
            lastBirthdayAt: context.now,
            happiness: clamp(state.pet.happiness + 20, STAT_MIN, STAT_MAX),
            lastInteractionAt: context.now,
          },
          records: {
            ...state.records,
            birthdays: state.records.birthdays + 1,
          },
          ui: {
            ...state.ui,
            displayStack: [],
            lastToast: `生日完成：${formatStageLabel(next)}。`,
          },
        }),
        events,
      }
    },
  },
  revive: {
    canApply: (state) =>
      state.pet.stage === 'dead' && state.records.revives < 1,
    apply: (state, context) => ({
      state: applyMood({
        ...state,
        pet: {
          ...state.pet,
          stage: 'adult',
          health: 55,
          deathSafety: 70,
          sickness: 'none',
          hunger: 35,
          happiness: 45,
          cleanliness: 65,
          lastInteractionAt: context.now,
        },
        records: {
          ...state.records,
          revives: state.records.revives + 1,
        },
        ui: {
          ...state.ui,
          lastToast: '已使用复活。',
        },
      }),
      events: [{ type: 'revived', at: context.now }],
    }),
  },
  newEgg: {
    canApply: (state) => state.pet.stage === 'dead',
    apply: (state, context) => ({
      state: createNewEggFromState(state, context.now),
      events: [{ type: 'newEggCreated', at: context.now }],
    }),
  },
  openMenu: {
    canApply: (state) => !state.world.activity,
    apply: (state, context) => ({
      state: {
        ...state,
        ui: {
          ...state.ui,
          displayStack: openMenuStack(
            state.ui.displayStack,
            context.command.targetId
          ),
        },
      },
      events: [],
    }),
  },
  closeMenu: {
    canApply: () => true,
    apply: (state) => ({
      state: {
        ...state,
        ui: {
          ...state.ui,
          displayStack: state.ui.displayStack.slice(0, -1),
        },
      },
      events: [],
    }),
  },
  startActivity: {
    canApply: (state) => canCareForAwakePet(state),
    apply: (state, context) =>
      startActivity(
        state,
        normalizeActivityId(context.command.targetId),
        context.now
      ),
  },
  endActivity: {
    canApply: (state) => Boolean(state.world.activity),
    apply: (state, context) => {
      const activityId = state.world.activity?.id ?? 'garden'
      return {
        state: {
          ...state,
          world: {
            ...state.world,
            activity: null,
            sceneId: 'home',
          },
        },
        events: [
          { type: 'activityEnded' as const, activityId, at: context.now },
        ],
      }
    },
  },
  claimMission: {
    canApply: (state, command) =>
      state.missions.list.some(
        (mission) =>
          mission.id === command.targetId &&
          mission.progress >= mission.goal &&
          !mission.claimed
      ),
    apply: (state, context) =>
      claimMission(state, context.command.targetId, context.now),
  },
  plant: {
    canApply: (state, command) =>
      canCareForAwakePet(state) &&
      getInventoryQuantity(state.resources.seeds, 'sprout-seed') > 0 &&
      state.garden.plots.some(
        (plot) => plot.id === command.targetId && !plot.cropId
      ),
    apply: (state, context) =>
      plantSeed(state, context.command.targetId, context.now),
  },
  water: {
    canApply: (state, command) =>
      state.garden.plots.some(
        (plot) => plot.id === command.targetId && Boolean(plot.cropId)
      ),
    apply: (state, context) => {
      const plots = state.garden.plots.map((plot) =>
        plot.id === context.command.targetId
          ? { ...plot, wateredAt: context.now }
          : plot
      )
      return {
        state: {
          ...state,
          garden: { ...state.garden, plots },
          ui: { ...state.ui, lastToast: '已经浇水。' },
        },
        events: [
          {
            type: 'gardenUpdated' as const,
            plotId: context.command.targetId ?? 'plot-1',
            at: context.now,
          },
        ],
      }
    },
  },
  harvest: {
    canApply: (state, command) =>
      state.garden.plots.some(
        (plot) =>
          plot.id === command.targetId &&
          Boolean(plot.cropId) &&
          plot.readyAt !== null &&
          plot.cropId !== 'withered'
      ),
    apply: (state, context) =>
      harvestPlot(state, context.command.targetId, context.now),
  },
  buyItem: {
    canApply: (state) => state.resources.coins >= 10,
    apply: (state, context) =>
      withMissionProgress(
        {
          state: {
            ...state,
            resources: {
              ...updateInventory(state.resources, 'seeds', 'sprout-seed', 1),
              coins: state.resources.coins - 10,
            },
            records: {
              ...state.records,
              shopPurchases: state.records.shopPurchases + 1,
            },
            ui: {
              ...state.ui,
              lastToast: '已购买种子包。',
            },
          },
          events: [],
        },
        ['dailyCare'],
        context.now
      ),
  },
  buyShopItem: {
    canApply: (state, command) => {
      const item = findShopItem(state, command.targetId)
      return Boolean(item && state.resources.coins >= item.price)
    },
    apply: (state, context) =>
      buyCatalogItem(state, context.command.targetId, context.now),
  },
  useItem: {
    canApply: (state) =>
      getInventoryQuantity(state.resources.items, 'soap') > 0,
    apply: (state, context) => {
      const cleaned = cleanState(state, context.now, 'dailyCare')
      return {
        ...cleaned,
        state: {
          ...cleaned.state,
          resources: updateInventory(
            cleaned.state.resources,
            'items',
            'soap',
            -1
          ),
        },
      }
    },
  },
  cook: {
    canApply: (state) =>
      canCareForAwakePet(state) &&
      getInventoryQuantity(state.garden.harvests, 'sprout-harvest') > 0,
    apply: (state, context) => ({
      state: applyMood({
        ...state,
        resources: updateInventory(state.resources, 'food', 'cooked-bowl', 1),
        garden: {
          ...state.garden,
          harvests: upsertInventory(
            state.garden.harvests,
            'sprout-harvest',
            -1
          ),
        },
        pet: {
          ...state.pet,
          skills: {
            ...state.pet.skills,
            expression: clamp(
              state.pet.skills.expression + 4,
              STAT_MIN,
              STAT_MAX
            ),
          },
          lastInteractionAt: context.now,
        },
        ui: { ...state.ui, lastToast: '已烹饪收获碗。' },
      }),
      events: [
        { type: 'inventoryChanged', itemId: 'cooked-bowl', at: context.now },
      ],
    }),
  },
  craftItem: {
    canApply: (state, command) => canCraft(state, command.targetId),
    apply: (state, context) =>
      craftRecipe(state, context.command.targetId, context.now),
  },
  placeFurniture: {
    canApply: (state, command) =>
      getInventoryQuantity(state.resources.furniture, command.targetId ?? '') >
      0,
    apply: (state, context) =>
      placeFurniture(state, context.command.targetId, context.now),
  },
  removeFurniture: {
    canApply: (state, command) =>
      state.world.furniturePlacements.some(
        (placement) => placement.id === command.targetId
      ),
    apply: (state, context) =>
      removeFurniture(state, context.command.targetId, context.now),
  },
  equipAccessory: {
    canApply: (state, command) =>
      getInventoryQuantity(
        state.resources.accessories,
        command.targetId ?? ''
      ) > 0,
    apply: (state, context) =>
      equipAccessory(state, context.command.targetId, context.now),
  },
  unequipAccessory: {
    canApply: (state, command) =>
      state.pet.equippedAccessories.some(
        (accessory) => accessory.itemId === command.targetId
      ),
    apply: (state, context) =>
      unequipAccessory(state, context.command.targetId),
  },
  startMinigame: {
    canApply: canCareForAwakePet,
    apply: (state, context) =>
      startActivity(
        state,
        'arcade',
        context.now,
        context.command.targetId ?? 'card-match'
      ),
  },
  finishMinigame: {
    canApply: (state) => state.world.activity?.id === 'arcade',
    apply: (state, context) =>
      finishMinigame(state, context.command.value, context.now),
  },
  work: {
    canApply: canCareForAwakePet,
    apply: (state, context) => startActivity(state, 'work', context.now),
  },
  fortune: {
    canApply: canCareForAwakePet,
    apply: (state) => ({
      state: {
        ...state,
        pet: {
          ...state.pet,
          happiness: clamp(state.pet.happiness + 6, STAT_MIN, STAT_MAX),
        },
        ui: { ...state.ui, lastToast: '占卜：稳定照护会带来好运。' },
      },
      events: [],
    }),
  },
  moveOut: {
    canApply: (state) =>
      state.pet.stage !== 'egg' && state.pet.stage !== 'dead',
    apply: (state, context) => ({
      state: moveOutToNewEgg(state, context.now),
      events: [{ type: 'newEggCreated', at: context.now }],
    }),
  },
  startVacation: {
    canApply: canCareForAwakePet,
    apply: (state, context) =>
      startActivity(
        {
          ...state,
          pet: { ...state.pet, onVacation: true },
          records: {
            ...state.records,
            vacations: state.records.vacations + 1,
          },
        },
        'vacation',
        context.now
      ),
  },
  endVacation: {
    canApply: (state) => state.pet.onVacation,
    apply: (state) => ({
      state: {
        ...state,
        pet: { ...state.pet, onVacation: false },
        world: { ...state.world, activity: null, sceneId: 'home' },
        ui: { ...state.ui, lastToast: '度假已结束。' },
      },
      events: [],
    }),
  },
  addFriend: {
    canApply: (_state, command) => Boolean(getCommandText(command)),
    apply: (state, context) =>
      addFriend(state, getCommandText(context.command), context.now),
  },
  removeFriend: {
    canApply: (state, command) =>
      state.friends.some((friend) => friend.id === command.targetId),
    apply: (state, context) => ({
      state: {
        ...state,
        friends: state.friends.filter(
          (friend) => friend.id !== context.command.targetId
        ),
        ui: { ...state.ui, lastToast: '好友已移除。' },
      },
      events: [{ type: 'socialUpdated', at: context.now }],
    }),
  },
  postSocial: {
    canApply: (state, command) =>
      state.featureFlags.social && Boolean(getCommandText(command)?.trim()),
    apply: (state, context) =>
      postSocial(state, getCommandText(context.command) ?? '', context.now),
  },
  likeSocialPost: {
    canApply: (state, command) =>
      state.social.posts.some((post) => post.id === command.targetId),
    apply: (state, context) => ({
      state: {
        ...state,
        social: {
          ...state.social,
          posts: state.social.posts.map((post) =>
            post.id === context.command.targetId
              ? { ...post, likes: post.likes + 1 }
              : post
          ),
        },
      },
      events: [{ type: 'socialUpdated', at: context.now }],
    }),
  },
  refreshOnline: {
    canApply: (state) => state.featureFlags.onlineHub,
    apply: (state, context) => ({
      state: {
        ...state,
        mockOnline: {
          ...state.mockOnline,
          pets: mockOnlineApi.listRandomPets(state).map((pet) => ({
            ...pet,
            lastSeenAt: context.now,
          })),
        },
        ui: { ...state.ui, lastToast: '模拟在线宠物已刷新。' },
      },
      events: [{ type: 'mockOnlineUpdated', at: context.now }],
    }),
  },
  interactOnlinePet: {
    canApply: (state, command) =>
      state.featureFlags.onlineHub &&
      state.mockOnline.pets.some((pet) => pet.id === command.targetId),
    apply: (state, context) =>
      interactOnlinePet(state, context.command.targetId, context.now),
  },
  snapMeal: {
    canApply: (state) => state.resources.coins >= 12,
    apply: (state, context) => {
      const meal = mockOnlineApi.orderSnapMeal(context.now)
      return {
        state: {
          ...state,
          resources: {
            ...updateInventory(state.resources, 'food', meal.itemId, 1),
            coins: state.resources.coins - 12,
          },
          ui: { ...state.ui, lastToast: `${meal.label}已送达。` },
        },
        events: [
          { type: 'inventoryChanged', itemId: meal.itemId, at: context.now },
        ],
      }
    },
  },
  toggleSetting: {
    canApply: () => true,
    apply: (state, context) =>
      toggleSetting(state, context.command, context.now),
  },
  toggleFeature: {
    canApply: () => true,
    apply: (state, context) =>
      toggleFeature(state, context.command, context.now),
  },
  updateProfile: {
    canApply: (_state, command) => Boolean(getCommandText(command)?.trim()),
    apply: (state, context) => ({
      state: {
        ...state,
        profile: {
          ...state.profile,
          username: sanitizeLabel(
            getCommandText(context.command) ?? state.profile.username
          ),
        },
        ui: { ...state.ui, lastToast: '资料已更新。' },
      },
      events: [{ type: 'socialUpdated', at: context.now }],
    }),
  },
  exportSave: {
    canApply: () => true,
    apply: (state) => ({
      state: {
        ...state,
        ui: {
          ...state.ui,
          lastToast: '导出内容已在设置中准备好。',
        },
      },
      events: [],
    }),
  },
  importSave: {
    canApply: () => true,
    apply: (state, context) => ({
      state: {
        ...state,
        ui: {
          ...state.ui,
          lastToast: context.command.value ?? '导入被拒绝。',
        },
      },
      events: [
        {
          type: 'saveRejected',
          reason: context.command.value ?? '存档数据无效',
          at: context.now,
        },
      ],
    }),
  },
  importMod: {
    canApply: () => true,
    apply: (state, context) =>
      importLocalMod(state, getCommandText(context.command) ?? '', context.now),
  },
}

function cleanState(state: GameState, now: number, missionId: MissionId) {
  return withMissionProgress(
    applyMood({
      ...state,
      pet: {
        ...state.pet,
        cleanliness: clamp(state.pet.cleanliness + 45, STAT_MIN, STAT_MAX),
        health: clamp(state.pet.health + 4, STAT_MIN, STAT_MAX),
        care: clamp(state.pet.care + 2, STAT_MIN, STAT_MAX),
        lastInteractionAt: now,
      },
      world: {
        ...state.world,
        poopCount: 0,
        digestionSeconds: 0,
        sceneId: 'bathroom',
      },
      carePressure: {
        ...state.carePressure,
        dirtySeconds: 0,
      },
      records: {
        ...state.records,
        bathsTaken: state.records.bathsTaken + 1,
      },
    }),
    [missionId],
    now
  )
}

function startActivity(
  state: GameState,
  activityId: ActivityId,
  now: number,
  detail?: string
): InteractionResult {
  const definition = state.catalogs.activities.find(
    (activity) => activity.id === activityId
  )
  const durationSeconds =
    definition?.durationSeconds ?? ACTIVITY_DURATION_SECONDS
  const next: GameState = {
    ...state,
    world: {
      ...state.world,
      sceneId: activityToScene(activityId),
      activity: {
        id: activityId,
        startedAt: now,
        endsAt: now + durationSeconds * 1000,
        locked: true,
      },
    },
    ui: {
      ...state.ui,
      displayStack: [],
      lastToast: `${definition?.label ?? formatActivityLabel(activityId)}已开始${detail ? `：${detail}` : ''}。`,
    },
  }

  return {
    state: next,
    events: [{ type: 'activityStarted' as const, activityId, at: now }],
  }
}

function withMissionProgress(
  resultOrState: GameState | { state: GameState; events: GameEvent[] },
  missionIds: MissionId[],
  now: number
): InteractionResult {
  const input =
    'events' in resultOrState
      ? resultOrState
      : { state: resultOrState, events: [] }
  const updatedIds: MissionId[] = []
  const list = input.state.missions.list.map((mission) => {
    if (!missionIds.includes(mission.id) || mission.claimed) return mission
    if (mission.progress >= mission.goal) return mission

    updatedIds.push(mission.id)
    return {
      ...mission,
      progress: Math.min(mission.goal, mission.progress + 1),
    }
  })

  return {
    state: {
      ...input.state,
      missions: {
        ...input.state.missions,
        list,
      },
    },
    events: [
      ...input.events,
      ...updatedIds.map((missionId) => ({
        type: 'missionUpdated' as const,
        missionId,
        at: now,
      })),
    ],
  }
}

function claimMission(
  state: GameState,
  missionId: string | undefined,
  now: number
) {
  let rewardCoins = 0
  const list = state.missions.list.map((mission) => {
    if (
      mission.id !== missionId ||
      mission.claimed ||
      mission.progress < mission.goal
    ) {
      return mission
    }

    rewardCoins = mission.rewardCoins
    return { ...mission, claimed: true }
  })

  return {
    state: {
      ...state,
      resources: {
        ...state.resources,
        coins: state.resources.coins + rewardCoins,
      },
      missions: {
        ...state.missions,
        points: state.missions.points + rewardCoins,
        list,
      },
      ui: {
        ...state.ui,
        lastToast: `已领取 ${rewardCoins} 金币。`,
      },
    },
    events:
      missionId && rewardCoins > 0
        ? [
            {
              type: 'missionClaimed' as const,
              missionId: missionId as MissionId,
              rewardCoins,
              at: now,
            },
          ]
        : [],
  }
}

function plantSeed(state: GameState, plotId: string | undefined, now: number) {
  const safePlotId = plotId ?? 'plot-1'
  const plots = state.garden.plots.map((plot) =>
    plot.id === safePlotId
      ? {
          ...plot,
          cropId: 'sprout',
          plantedAt: now,
          wateredAt: now,
          readyAt: null,
          witheredAt: null,
        }
      : plot
  )

  return withMissionProgress(
    {
      state: {
        ...state,
        resources: updateInventory(state.resources, 'seeds', 'sprout-seed', -1),
        garden: {
          ...state.garden,
          plots,
        },
        world: {
          ...state.world,
          sceneId: 'garden',
        },
        ui: {
          ...state.ui,
          lastToast: '种子已种下。',
        },
      },
      events: [{ type: 'gardenUpdated', plotId: safePlotId, at: now }],
    },
    ['gardenStart'],
    now
  )
}

function harvestPlot(
  state: GameState,
  plotId: string | undefined,
  now: number
): InteractionResult {
  const safePlotId = plotId ?? 'plot-1'
  const plots = state.garden.plots.map((plot) =>
    plot.id === safePlotId
      ? {
          ...plot,
          cropId: null,
          plantedAt: null,
          wateredAt: null,
          readyAt: null,
          witheredAt: null,
        }
      : plot
  )

  return {
    state: {
      ...state,
      garden: {
        ...state.garden,
        plots,
        harvests: upsertInventory(state.garden.harvests, 'sprout-harvest', 1),
      },
      resources: updateInventory(state.resources, 'items', 'sprout-harvest', 1),
      records: {
        ...state.records,
        plantsHarvested: state.records.plantsHarvested + 1,
      },
      ui: {
        ...state.ui,
        lastToast: '收获物已收集。',
      },
    },
    events: [{ type: 'gardenUpdated' as const, plotId: safePlotId, at: now }],
  }
}

function updateInventory<
  T extends {
    food: InventoryItem[]
    items: InventoryItem[]
    seeds: InventoryItem[]
    furniture: InventoryItem[]
    accessories: InventoryItem[]
    materials: InventoryItem[]
  },
  K extends keyof T,
>(resources: T, bucket: K, itemId: string, delta: number): T {
  return {
    ...resources,
    [bucket]: upsertInventory(
      resources[bucket] as InventoryItem[],
      itemId,
      delta
    ),
  }
}

function upsertInventory(
  items: InventoryItem[],
  itemId: string,
  delta: number
) {
  const next = items
    .map((item) =>
      item.id === itemId
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
    )
    .filter((item) => item.quantity > 0)

  if (!items.some((item) => item.id === itemId) && delta > 0) {
    next.push({ id: itemId, quantity: delta })
  }

  return next
}

function getInventoryQuantity(items: InventoryItem[], itemId: string) {
  return items.find((item) => item.id === itemId)?.quantity ?? 0
}

function openMenuStack(
  current: MenuId[],
  targetId: string | undefined
): MenuId[] {
  const menuId = normalizeMenuId(targetId)
  if (menuId === 'main') return ['main']
  if (current.length === 0) return ['main', menuId]
  return [...current.filter((id) => id !== menuId), menuId]
}

function normalizeMenuId(targetId: string | undefined): MenuId {
  if (targetId && MAIN_MENUS.includes(targetId as MenuId)) {
    return targetId as MenuId
  }
  if (targetId === 'settings') return 'settings'
  return 'main'
}

function normalizeActivityId(targetId: string | undefined): ActivityId {
  if (
    targetId === 'shop' ||
    targetId === 'mall' ||
    targetId === 'market' ||
    targetId === 'school' ||
    targetId === 'garden' ||
    targetId === 'bath' ||
    targetId === 'toilet' ||
    targetId === 'cleanRoom' ||
    targetId === 'cooking' ||
    targetId === 'arcade' ||
    targetId === 'work' ||
    targetId === 'fortune' ||
    targetId === 'rabbitHole' ||
    targetId === 'vacation' ||
    targetId === 'snapMeal'
  ) {
    return targetId
  }

  return 'garden'
}

function activityToScene(activityId: ActivityId) {
  if (activityId === 'bath' || activityId === 'toilet') return 'bathroom'
  if (activityId === 'shop' || activityId === 'mall' || activityId === 'market')
    return 'shop'
  if (activityId === 'school') return 'school'
  if (activityId === 'garden') return 'garden'
  if (activityId === 'cooking') return 'kitchen'
  if (activityId === 'arcade') return 'arcade'
  if (activityId === 'work') return 'work'
  if (activityId === 'vacation') return 'vacation'
  return 'home'
}

function formatActivityLabel(activityId: ActivityId) {
  const labels: Record<ActivityId, string> = {
    arcade: '街机',
    bath: '洗澡',
    cleanRoom: '打扫房间',
    cooking: '烹饪',
    fortune: '占卜',
    garden: '花园',
    mall: '商场',
    market: '市场',
    rabbitHole: '兔子洞',
    school: '学校',
    shop: '商店',
    snapMeal: '快餐',
    toilet: '如厕',
    vacation: '度假',
    work: '打工',
  }
  return labels[activityId]
}

function formatStageLabel(stage: PetStage) {
  const labels: Record<PetStage, string> = {
    adult: '成年',
    baby: '幼年',
    child: '童年',
    dead: '死亡',
    egg: '蛋',
    elder: '长者',
    teen: '少年',
  }
  return labels[stage]
}

function finishWant(
  pet: GameState['pet'],
  kind: NonNullable<GameState['pet']['want']>['kind'],
  now: number
) {
  if (!pet.want || pet.want.kind !== kind || pet.want.completedAt !== null) {
    return pet
  }

  return {
    ...pet,
    want: {
      ...pet.want,
      completedAt: now,
    },
    happiness: clamp(pet.happiness + 8, STAT_MIN, STAT_MAX),
    care: clamp(pet.care + 4, STAT_MIN, STAT_MAX),
  }
}

function findShopItem(state: GameState, itemId: string | undefined) {
  return state.catalogs.shop.find((item) => item.id === itemId)
}

function buyCatalogItem(
  state: GameState,
  itemId: string | undefined,
  now: number
): InteractionResult {
  const item = findShopItem(state, itemId)
  if (!item) return { state, events: [] }

  const bucket = itemKindToBucket(item.kind)
  return {
    state: {
      ...state,
      resources: {
        ...updateInventory(state.resources, bucket, item.id, 1),
        coins: state.resources.coins - item.price,
      },
      records: {
        ...state.records,
        shopPurchases: state.records.shopPurchases + 1,
      },
      ui: {
        ...state.ui,
        lastToast: `已购买${item.label}。`,
      },
    },
    events: [{ type: 'inventoryChanged', itemId: item.id, at: now }],
  }
}

function itemKindToBucket(
  kind: NonNullable<ReturnType<typeof findShopItem>>['kind']
) {
  if (kind === 'food') return 'food'
  if (kind === 'seed') return 'seeds'
  if (kind === 'furniture') return 'furniture'
  if (kind === 'accessory') return 'accessories'
  if (kind === 'material') return 'materials'
  return 'items'
}

function canCraft(state: GameState, recipeId: string | undefined) {
  const recipe = state.catalogs.craft.find((item) => item.id === recipeId)
  if (!recipe) return false
  return recipe.cost.every(
    (cost) => getAnyInventoryQuantity(state, cost.id) >= cost.quantity
  )
}

function craftRecipe(
  state: GameState,
  recipeId: string | undefined,
  now: number
): InteractionResult {
  const recipe = state.catalogs.craft.find((item) => item.id === recipeId)
  if (!recipe) return { state, events: [] }

  let resources = state.resources
  let garden = state.garden
  for (const cost of recipe.cost) {
    if (getInventoryQuantity(resources.items, cost.id) > 0) {
      resources = updateInventory(resources, 'items', cost.id, -cost.quantity)
    } else if (getInventoryQuantity(resources.materials, cost.id) > 0) {
      resources = updateInventory(
        resources,
        'materials',
        cost.id,
        -cost.quantity
      )
    } else {
      garden = {
        ...garden,
        harvests: upsertInventory(garden.harvests, cost.id, -cost.quantity),
      }
    }
  }

  resources = updateInventory(
    resources,
    recipe.outputBucket,
    recipe.output.id,
    recipe.output.quantity
  )

  return withMissionProgress(
    {
      state: {
        ...state,
        resources,
        garden,
        records: {
          ...state.records,
          craftsCompleted: state.records.craftsCompleted + 1,
        },
        ui: { ...state.ui, lastToast: `已合成${recipe.label}。` },
      },
      events: [{ type: 'inventoryChanged', itemId: recipe.output.id, at: now }],
    },
    ['craftDecor'],
    now
  )
}

function getAnyInventoryQuantity(state: GameState, itemId: string) {
  return (
    getInventoryQuantity(state.resources.items, itemId) +
    getInventoryQuantity(state.resources.materials, itemId) +
    getInventoryQuantity(state.garden.harvests, itemId)
  )
}

function placeFurniture(
  state: GameState,
  itemId: string | undefined,
  now: number
): InteractionResult {
  const safeItemId = itemId ?? 'round-chair'
  const placement = {
    id: `placement-${now}`,
    itemId: safeItemId,
    x: 96 + state.world.furniturePlacements.length * 18,
    y: 96,
  }

  return {
    state: {
      ...state,
      world: {
        ...state.world,
        furniture: [...state.world.furniture, safeItemId],
        furniturePlacements: [...state.world.furniturePlacements, placement],
      },
      ui: { ...state.ui, lastToast: '家具已摆放。' },
    },
    events: [{ type: 'inventoryChanged', itemId: safeItemId, at: now }],
  }
}

function removeFurniture(
  state: GameState,
  placementId: string | undefined,
  now: number
): InteractionResult {
  const removed = state.world.furniturePlacements.find(
    (placement) => placement.id === placementId
  )
  return {
    state: {
      ...state,
      world: {
        ...state.world,
        furniturePlacements: state.world.furniturePlacements.filter(
          (placement) => placement.id !== placementId
        ),
        furniture: state.world.furniture.filter(
          (_item, index) =>
            index !== state.world.furniturePlacements.indexOf(removed!)
        ),
      },
      ui: { ...state.ui, lastToast: '家具已移除。' },
    },
    events: [
      {
        type: 'inventoryChanged',
        itemId: removed?.itemId ?? 'furniture',
        at: now,
      },
    ],
  }
}

function equipAccessory(
  state: GameState,
  itemId: string | undefined,
  now: number
): InteractionResult {
  const safeItemId = itemId ?? 'star-pin'
  const slot = safeItemId.includes('pin') ? 'head' : 'body'
  return {
    state: {
      ...state,
      pet: {
        ...state.pet,
        equippedAccessories: [
          ...state.pet.equippedAccessories.filter(
            (accessory) => accessory.slot !== slot
          ),
          { slot, itemId: safeItemId },
        ],
      },
      ui: { ...state.ui, lastToast: '饰品已佩戴。' },
    },
    events: [{ type: 'inventoryChanged', itemId: safeItemId, at: now }],
  }
}

function unequipAccessory(
  state: GameState,
  itemId: string | undefined
): InteractionResult {
  return {
    state: {
      ...state,
      pet: {
        ...state.pet,
        equippedAccessories: state.pet.equippedAccessories.filter(
          (accessory) => accessory.itemId !== itemId
        ),
      },
      ui: { ...state.ui, lastToast: '饰品已取下。' },
    },
    events: [],
  }
}

function finishMinigame(
  state: GameState,
  result: string | undefined,
  now: number
): InteractionResult {
  const won = result !== 'lose'
  const reward = won ? 12 : 4
  return withMissionProgress(
    {
      state: {
        ...state,
        resources: {
          ...state.resources,
          coins: state.resources.coins + reward,
        },
        pet: {
          ...state.pet,
          skills: {
            ...state.pet.skills,
            logic: clamp(state.pet.skills.logic + 5, STAT_MIN, STAT_MAX),
          },
          happiness: clamp(state.pet.happiness + 8, STAT_MIN, STAT_MAX),
        },
        world: { ...state.world, activity: null, sceneId: 'home' },
        records: { ...state.records, arcadeRuns: state.records.arcadeRuns + 1 },
        ui: { ...state.ui, lastToast: `街机结束，获得 ${reward} 金币。` },
      },
      events: [{ type: 'activityEnded', activityId: 'arcade', at: now }],
    },
    ['arcadeRun'],
    now
  )
}

function moveOutToNewEgg(state: GameState, now: number) {
  return createNewEggFromState(
    {
      ...state,
      profile: {
        ...state.profile,
        achievements: [...state.profile.achievements, 'move-out'],
      },
    },
    now
  )
}

function addFriend(
  state: GameState,
  code: string | undefined,
  now: number
): InteractionResult {
  const safeCode = sanitizeLabel(code ?? `LOCAL-${now}`)
  const friend = mockOnlineApi.addFriendByCode(state, safeCode, now)
  return withMissionProgress(
    {
      state: {
        ...state,
        friends: [...state.friends, friend],
        ui: { ...state.ui, lastToast: `已添加${friend.name}。` },
      },
      events: [{ type: 'socialUpdated', at: now }],
    },
    ['firstFriend'],
    now
  )
}

function postSocial(
  state: GameState,
  body: string,
  now: number
): InteractionResult {
  const post = mockOnlineApi.createSocialPost(state, sanitizeLabel(body), now)
  return withMissionProgress(
    {
      state: {
        ...state,
        social: {
          ...state.social,
          posts: [post, ...state.social.posts].slice(0, 20),
          draft: '',
        },
        records: {
          ...state.records,
          socialPosts: state.records.socialPosts + 1,
        },
        ui: { ...state.ui, lastToast: '已发布到本地社交。' },
      },
      events: [{ type: 'socialUpdated', at: now }],
    },
    ['socialPost'],
    now
  )
}

function interactOnlinePet(
  state: GameState,
  petId: string | undefined,
  now: number
): InteractionResult {
  if (!petId) return { state, events: [] }
  const interaction = mockOnlineApi.createInteraction(petId, 'wave', now)
  return {
    state: {
      ...state,
      mockOnline: {
        ...state.mockOnline,
        interactions: [interaction, ...state.mockOnline.interactions].slice(
          0,
          30
        ),
      },
      ui: { ...state.ui, lastToast: '模拟在线互动已发送。' },
    },
    events: [{ type: 'mockOnlineUpdated', at: now }],
  }
}

function importLocalMod(
  state: GameState,
  text: string,
  now: number
): InteractionResult {
  const result = parseLocalModDefinition(text)
  if (result.status === 'rejected') {
    return {
      state: {
        ...state,
        ui: { ...state.ui, lastToast: `模组被拒绝：${result.reason}` },
      },
      events: [{ type: 'saveRejected', reason: result.reason, at: now }],
    }
  }

  const shopById = new Map(
    state.catalogs.shop.map((item) => [item.id, item] as const)
  )
  for (const item of result.mod.shopItems) {
    shopById.set(item.id, item)
  }

  const craftById = new Map(
    state.catalogs.craft.map((recipe) => [recipe.id, recipe] as const)
  )
  for (const recipe of result.mod.craftRecipes) {
    craftById.set(recipe.id, recipe)
  }

  return {
    state: {
      ...state,
      catalogs: {
        ...state.catalogs,
        shop: Array.from(shopById.values()),
        craft: Array.from(craftById.values()),
      },
      featureFlags: {
        ...state.featureFlags,
        mods: true,
      },
      ui: {
        ...state.ui,
        lastToast: `本地模组已导入：${result.mod.name}。`,
      },
    },
    events: [{ type: 'modImported', name: result.mod.name, at: now }],
  }
}

function toggleSetting(
  state: GameState,
  command: GameCommand,
  now: number
): InteractionResult {
  const key =
    command.payload?.kind === 'settings'
      ? command.payload.key
      : (command.targetId as keyof GameState['settings'])
  if (!(key in state.settings)) return { state, events: [] }
  const current = state.settings[key]
  const rawValue =
    command.payload?.kind === 'settings' ? command.payload.value : command.value
  const nextValue =
    typeof current === 'boolean'
      ? rawValue === undefined
        ? !current
        : rawValue === true || rawValue === 'true'
      : (rawValue ?? current)
  return {
    state: {
      ...state,
      settings: {
        ...state.settings,
        [key]: nextValue,
      },
      ui: { ...state.ui, lastToast: '设置已更新。' },
    },
    events: [
      { type: 'errorRecovered', message: `setting:${String(key)}`, at: now },
    ],
  }
}

function toggleFeature(
  state: GameState,
  command: GameCommand,
  now: number
): InteractionResult {
  const key =
    command.payload?.kind === 'feature'
      ? command.payload.key
      : (command.targetId as keyof GameState['featureFlags'])
  if (!(key in state.featureFlags)) return { state, events: [] }
  const rawValue =
    command.payload?.kind === 'feature' ? command.payload.value : command.value
  return {
    state: {
      ...state,
      featureFlags: {
        ...state.featureFlags,
        [key]:
          rawValue === undefined
            ? !state.featureFlags[key]
            : rawValue === true || rawValue === 'true',
      },
      ui: { ...state.ui, lastToast: '模拟功能开关已更新。' },
    },
    events: [
      { type: 'errorRecovered', message: `feature:${String(key)}`, at: now },
    ],
  }
}

function sanitizeLabel(value: string) {
  return (
    value
      .trim()
      .replace(/[^\w -]/g, '')
      .slice(0, 80) || '本地'
  )
}

function getCommandText(command: GameCommand) {
  if (command.payload?.kind === 'social') {
    return command.payload.body ?? command.payload.friendCode
  }
  if (command.payload?.kind === 'profile') return command.payload.username
  if (command.payload?.kind === 'importExport') return command.payload.text
  if (command.payload?.kind === 'mod') return command.payload.text
  return command.value ?? command.targetId
}

function nextManualStage(stage: PetStage): PetStage {
  if (stage === 'baby') return 'child'
  if (stage === 'child') return 'teen'
  if (stage === 'teen') return 'adult'
  if (stage === 'adult') return 'elder'
  return 'baby'
}

function createNewEggFromState(state: GameState, now: number): GameState {
  return {
    ...state,
    pet: {
      ...state.pet,
      id: crypto.randomUUID(),
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
      bornAt: now,
      hatchedAt: null,
      lastBirthdayAt: null,
      lastInteractionAt: now,
    },
    world: {
      ...state.world,
      sceneId: 'home',
      activity: null,
      poopCount: 0,
      digestionSeconds: 0,
    },
    carePressure: {
      hungrySeconds: 0,
      dirtySeconds: 0,
      sickSeconds: 0,
      neglectSeconds: 0,
    },
    profile: {
      ...state.profile,
      generation: state.profile.generation + 1,
    },
    ui: {
      displayStack: [],
      lastToast: '新的蛋到了。',
    },
  }
}
