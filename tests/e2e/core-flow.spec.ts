import { expect, test } from '@playwright/test'

test('new user starts on egg with locked menus', async ({ page }) => {
  await resetAndGoto(page)
  await expect(page.getByRole('region', { name: '宠物画面' })).toBeVisible()
  await expect(page.getByText('蛋', { exact: true })).toBeVisible()
  await expect(page.getByText('币 25')).toBeVisible()
  await expect(page.getByRole('button', { name: /喂食/ })).toBeDisabled()
  await expectCanvasHasPixels(page)
})

test('hatches with fast hatch and completes a care loop', async ({ page }) => {
  await resetAndGoto(page)

  await enableFastHatch(page)
  await expect(page.getByText('幼体')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('button', { name: /喂食/ })).toBeEnabled()
  await expectCanvasHasPixels(page)

  await page.getByRole('button', { name: /喂食/ }).click()
  await page.getByRole('button', { name: /^正餐/ }).click()
  await expect(page.getByRole('button', { name: /^正餐/ })).toBeVisible()

  await page.getByRole('button', { name: /清洁/ }).click()
  await page.getByRole('button', { name: /^刷牙/ }).click()
  await expect(page.getByText('已经刷牙。')).toBeVisible()

  await page.getByRole('button', { name: /照护/ }).click()
  await page
    .getByLabel('菜单面板')
    .getByRole('button', { name: '睡觉' })
    .click()
  await expectCanvasHasPixels(page)
  await expect(
    page.getByLabel('菜单面板').getByRole('button', { name: '叫醒' })
  ).toBeEnabled()
})

test('covers shop, school, garden, and mock online menus', async ({ page }) => {
  await resetAndGoto(page)
  await enableFastHatch(page)
  await expect(page.getByText('幼体')).toBeVisible({ timeout: 10_000 })

  await page.getByRole('button', { name: /状态/ }).click()
  await page.getByRole('button', { name: /^设置$/ }).click()
  await page.getByRole('button', { name: /模拟社交/ }).click()
  await page.getByRole('button', { name: /模拟中心/ }).click()
  await expect(
    page.getByRole('button', { name: '本地模组', exact: true })
  ).toHaveCount(0)
  await page.getByRole('button', { name: /薄荷/ }).click()
  await expect(page.locator('main')).toHaveClass(/app-shell--mint/)

  await page.getByRole('button', { name: /活动/ }).click()
  await page.getByRole('button', { name: /^学校/ }).click()
  await page.getByRole('button', { name: /^课程/ }).click()
  await expect(page.getByText('学校已开始。')).toBeVisible()
  await page.getByRole('button', { name: /结束活动/ }).click()

  const activityButton = page.locator('.action-dock button').nth(4)
  await expect(activityButton).toBeEnabled()
  await activityButton.click()
  await page.getByRole('button', { name: /^商店/ }).click()
  await expect(page.getByRole('button', { name: /正餐包/ })).toBeVisible()

  await page.getByRole('button', { name: /花园/ }).click()
  await expect(page.getByText(/种子/)).toBeVisible()
  await expectCanvasHasPixels(page)

  await page.getByRole('button', { name: /电话/ }).click()
  await page.getByRole('button', { name: /^社交/ }).click()
  await page.getByRole('button', { name: /^发布/ }).click()
  await expect(page.getByText('已发布到本地社交。')).toBeVisible()

  await page.getByRole('button', { name: /电话/ }).click()
  await page.getByRole('button', { name: /^在线/ }).click()
  await page.getByRole('button', { name: /^刷新/ }).click()
  await expect(page.getByText('模拟在线宠物已刷新。')).toBeVisible()
})

test('restores a legacy localStorage save when IndexedDB is empty', async ({
  browser,
}) => {
  const context = await browser.newContext()
  await context.addInitScript(() => {
    const now = Date.now()
    localStorage.setItem(
      'tamakey.save.v2',
      JSON.stringify({
        schemaVersion: 2,
        savedAt: now,
        game: {
          schemaVersion: 2,
          version: 1,
          pet: {
            id: 'legacy-browser',
            name: 'Browser Legacy',
            species: 'starter',
            stage: 'child',
            mood: 'happy',
            ageSeconds: 3600,
            hunger: 12,
            happiness: 82,
            cleanliness: 90,
            bladder: 10,
            energy: 70,
            health: 100,
            discipline: 25,
            care: 50,
            deathSafety: 100,
            sickness: 'none',
            sleepState: 'awake',
            careMistakes: 0,
            bornAt: now,
            hatchedAt: now,
            lastBirthdayAt: null,
            lastInteractionAt: now,
          },
          resources: {
            coins: 44,
            food: [{ id: 'basic-meal', quantity: 2 }],
            items: [{ id: 'soap', quantity: 1 }],
            seeds: [],
            furniture: [],
            accessories: [],
            medicine: 1,
          },
          world: {
            sceneId: 'home',
            activity: null,
            poopCount: 0,
            roomId: 'default',
            digestionSeconds: 0,
            furniture: [],
          },
          carePressure: {
            hungrySeconds: 0,
            dirtySeconds: 0,
            sickSeconds: 0,
            neglectSeconds: 0,
          },
          missions: {
            dailySeed: '2026-01-01',
            resetAt: now + 86_400_000,
            points: 0,
            list: [],
          },
          garden: {
            plots: [],
            harvests: [],
          },
          profile: {
            username: 'legacy-caretaker',
            generation: 3,
            achievements: ['migration'],
          },
          records: {
            mealsFed: 1,
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
          },
          featureFlags: {
            onlineHub: false,
            social: false,
            mods: false,
          },
          createdAt: now,
          lastTickAt: now,
          lastSavedAt: now,
        },
        settings: {
          notificationsEnabled: false,
          reducedMotion: false,
          soundEnabled: true,
          fastHatch: false,
        },
      })
    )
  })

  const page = await context.newPage()
  await page.goto('/')

  await expect(page.getByText('小孩')).toBeVisible()
  await expect(page.getByRole('button', { name: /状态/ })).toBeEnabled()
  await page.getByRole('button', { name: /状态/ }).click()
  await expect(page.getByText('legacy-caretaker')).toBeVisible()
  await expect(page.getByText('币 44', { exact: true })).toBeVisible()

  await context.close()
})

async function enableFastHatch(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /状态/ }).click()
  await page.getByRole('button', { name: /^设置$/ }).click()
  await page.getByRole('button', { name: /快速孵化/ }).click()
  await page.waitForTimeout(6_500)
}

async function resetAndGoto(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(async () => {
    localStorage.clear()
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase('tamakey-save-db')
      request.onsuccess = () => resolve()
      request.onerror = () => resolve()
      request.onblocked = () => resolve()
    })
  })
  await page.reload()
}

async function expectCanvasHasPixels(page: import('@playwright/test').Page) {
  await expect
    .poll(async () =>
      page.locator('canvas').evaluate((canvas) => {
        const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
        if (!gl) return 0
        const width = Math.max(1, Math.min(canvas.width, 64))
        const height = Math.max(1, Math.min(canvas.height, 64))
        const data = new Uint8Array(width * height * 4)
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data)
        let colored = 0
        for (let index = 3; index < data.length; index += 4) {
          if (data[index] > 0) colored += 1
        }
        return colored
      })
    )
    .toBeGreaterThan(100)
}
