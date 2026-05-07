import { describe, expect, it } from 'vitest'

import { advanceGameTimeByDelta } from '../application/advanceGameTime'
import { applyInteraction } from '../application/applyInteraction'
import { createInitialGame } from '../application/createInitialGame'

describe('core replication rules', () => {
  it('starts as an egg and hatches idempotently', () => {
    const now = Date.UTC(2026, 0, 1)
    const initial = {
      ...createInitialGame(now),
      settings: { ...createInitialGame(now).settings, fastHatch: true },
    }

    const first = advanceGameTimeByDelta(initial, 6, now + 6_000)
    const second = advanceGameTimeByDelta(first.state, 1, now + 7_000)

    expect(initial.pet.stage).toBe('egg')
    expect(first.state.pet.stage).toBe('baby')
    expect(
      first.events.filter((event) => event.type === 'hatched')
    ).toHaveLength(1)
    expect(
      second.events.filter((event) => event.type === 'hatched')
    ).toHaveLength(0)
  })

  it('blocks care while egg and allows care after hatch', () => {
    const now = Date.UTC(2026, 0, 1)
    const egg = createInitialGame(now)
    const invalid = applyInteraction(egg, 'feedMeal', now)
    const baby = advanceGameTimeByDelta(
      { ...egg, settings: { ...egg.settings, fastHatch: true } },
      6,
      now + 6_000
    ).state
    const fed = applyInteraction(
      { ...baby, pet: { ...baby.pet, hunger: 80 } },
      'feedMeal',
      now + 7_000
    )

    expect(invalid.events[0]?.type).toBe('invalidInteraction')
    expect(fed.state.pet.hunger).toBeLessThan(80)
    expect(fed.events.some((event) => event.type === 'missionUpdated')).toBe(
      true
    )
  })

  it('advances neglect into death and supports new egg', () => {
    const now = Date.UTC(2026, 0, 1)
    const baby = advanceGameTimeByDelta(
      {
        ...createInitialGame(now),
        settings: { ...createInitialGame(now).settings, fastHatch: true },
      },
      6,
      now + 6_000
    ).state
    const neglected = {
      ...baby,
      pet: {
        ...baby.pet,
        hunger: 100,
        cleanliness: 0,
        health: 1,
        deathSafety: 1,
      },
      carePressure: {
        ...baby.carePressure,
        hungrySeconds: 12 * 60 * 60,
        dirtySeconds: 12 * 60 * 60,
        neglectSeconds: 12 * 60 * 60,
      },
    }
    const dead = advanceGameTimeByDelta(
      neglected,
      60 * 60,
      now + 60 * 60 * 1000
    )
    const egg = applyInteraction(dead.state, 'newEgg', now + 60 * 60 * 1000)

    expect(dead.state.pet.stage).toBe('dead')
    expect(dead.events.some((event) => event.type === 'died')).toBe(true)
    expect(egg.state.pet.stage).toBe('egg')
  })

  it('handles activities, missions, and garden lifecycle', () => {
    const now = Date.UTC(2026, 0, 1)
    const baby = advanceGameTimeByDelta(
      {
        ...createInitialGame(now),
        settings: { ...createInitialGame(now).settings, fastHatch: true },
      },
      6,
      now + 6_000
    ).state
    const planted = applyInteraction(
      baby,
      { type: 'plant', targetId: 'plot-1' },
      now + 7_000
    )
    const grown = advanceGameTimeByDelta(
      planted.state,
      31 * 60,
      now + 31 * 60 * 1000
    )
    const harvested = applyInteraction(
      grown.state,
      { type: 'harvest', targetId: 'plot-1' },
      now + 32 * 60 * 1000
    )
    const school = applyInteraction(
      harvested.state,
      { type: 'startActivity', targetId: 'school' },
      now + 33 * 60 * 1000
    )
    const finished = advanceGameTimeByDelta(
      school.state,
      13,
      now + 34 * 60 * 1000
    )

    expect(planted.state.garden.plots[0]?.cropId).toBe('sprout')
    expect(grown.state.garden.plots[0]?.readyAt).not.toBeNull()
    expect(harvested.state.records.plantsHarvested).toBe(1)
    expect(school.state.world.activity?.id).toBe('school')
    expect(finished.state.world.activity).toBeNull()
    expect(finished.state.records.schoolLessons).toBe(1)
  })

  it('handles shop, craft, furniture, accessories, and settings commands', () => {
    const now = Date.UTC(2026, 0, 1)
    const baby = advanceGameTimeByDelta(
      {
        ...createInitialGame(now),
        settings: { ...createInitialGame(now).settings, fastHatch: true },
      },
      6,
      now + 6_000
    ).state

    const boughtFurniture = applyInteraction(
      { ...baby, resources: { ...baby.resources, coins: 100 } },
      { type: 'buyShopItem', targetId: 'round-chair' },
      now + 7_000
    )
    const placed = applyInteraction(
      boughtFurniture.state,
      { type: 'placeFurniture', targetId: 'round-chair' },
      now + 8_000
    )
    const boughtAccessory = applyInteraction(
      placed.state,
      { type: 'buyShopItem', targetId: 'star-pin' },
      now + 9_000
    )
    const equipped = applyInteraction(
      boughtAccessory.state,
      { type: 'equipAccessory', targetId: 'star-pin' },
      now + 10_000
    )
    const craftable = {
      ...equipped.state,
      garden: {
        ...equipped.state.garden,
        harvests: [{ id: 'sprout-harvest', quantity: 1 }],
      },
      resources: {
        ...equipped.state.resources,
        materials: [{ id: 'soft-fiber', quantity: 1 }],
      },
    }
    const crafted = applyInteraction(
      craftable,
      { type: 'craftItem', targetId: 'leaf-rug' },
      now + 11_000
    )
    const setting = applyInteraction(
      crafted.state,
      { type: 'toggleSetting', targetId: 'fastHatch', value: 'true' },
      now + 12_000
    )

    expect(placed.state.world.furniturePlacements).toHaveLength(1)
    expect(equipped.state.pet.equippedAccessories[0]?.itemId).toBe('star-pin')
    expect(
      crafted.state.resources.furniture.some((item) => item.id === 'leaf-rug')
    ).toBe(true)
    expect(setting.state.settings.fastHatch).toBe(true)
  })

  it('handles mock social and online commands behind feature flags', () => {
    const now = Date.UTC(2026, 0, 1)
    const baby = advanceGameTimeByDelta(
      {
        ...createInitialGame(now),
        settings: { ...createInitialGame(now).settings, fastHatch: true },
        featureFlags: { onlineHub: true, social: true, mods: false },
      },
      6,
      now + 6_000
    ).state

    const friend = applyInteraction(
      baby,
      { type: 'addFriend', value: 'LOCAL-ABCD' },
      now + 7_000
    )
    const post = applyInteraction(
      friend.state,
      { type: 'postSocial', value: 'Local update' },
      now + 8_000
    )
    const refreshed = applyInteraction(post.state, 'refreshOnline', now + 9_000)
    const interacted = applyInteraction(
      refreshed.state,
      {
        type: 'interactOnlinePet',
        targetId: refreshed.state.mockOnline.pets[0]?.id,
      },
      now + 10_000
    )
    const meal = applyInteraction(interacted.state, 'snapMeal', now + 11_000)

    expect(friend.state.friends).toHaveLength(1)
    expect(post.state.social.posts[0]?.body).toBe('Local update')
    expect(
      refreshed.events.some((event) => event.type === 'mockOnlineUpdated')
    ).toBe(true)
    expect(interacted.state.mockOnline.interactions).toHaveLength(1)
    expect(
      meal.state.resources.food.some((item) => item.id === 'snap-meal')
    ).toBe(true)
  })

  it('imports safe local mods and rejects unsafe mod text', () => {
    const now = Date.UTC(2026, 0, 1)
    const state = createInitialGame(now)
    const modText = JSON.stringify({
      schemaVersion: 1,
      name: 'Local Decor',
      shopItems: [
        {
          id: 'mod-moon-chair',
          label: 'Moon Chair',
          kind: 'furniture',
          price: 22,
        },
      ],
      craftRecipes: [
        {
          id: 'mod-moon-pin',
          label: 'Moon Pin',
          cost: [{ id: 'soft-fiber', quantity: 1 }],
          output: { id: 'mod-moon-pin', quantity: 1 },
          outputBucket: 'accessories',
        },
      ],
    })

    const imported = applyInteraction(
      state,
      {
        type: 'importMod',
        value: modText,
        payload: { kind: 'mod', text: modText },
      },
      now + 1_000
    )
    const rejected = applyInteraction(
      imported.state,
      { type: 'importMod', value: '{"schemaVersion":1,"name":"<script>"}' },
      now + 2_000
    )

    expect(imported.state.featureFlags.mods).toBe(true)
    expect(
      imported.state.catalogs.shop.some((item) => item.id === 'mod-moon-chair')
    ).toBe(true)
    expect(imported.events.some((event) => event.type === 'modImported')).toBe(
      true
    )
    expect(rejected.events[0]?.type).toBe('saveRejected')
    expect(
      rejected.state.catalogs.shop.some((item) => item.id === 'mod-moon-chair')
    ).toBe(true)
  })
})
