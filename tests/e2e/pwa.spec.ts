import { expect, test } from '@playwright/test'

test('serves installable PWA metadata and icon assets', async ({ page }) => {
  await page.goto('/')

  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute('href')
  expect(manifestHref).toBeTruthy()

  const manifestResponse = await page.request.get(manifestHref ?? '')
  expect(manifestResponse.ok()).toBe(true)

  const manifest = await manifestResponse.json()
  expect(manifest).toMatchObject({
    id: '/',
    name: 'Tamakey',
    short_name: 'Tamakey',
    display: 'standalone',
    scope: '/',
    start_url: '/',
  })
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: '/pwa-192.png', sizes: '192x192' }),
      expect.objectContaining({ src: '/pwa-512.png', sizes: '512x512' }),
    ])
  )

  for (const icon of manifest.icons) {
    const iconResponse = await page.request.get(icon.src)
    expect(iconResponse.ok()).toBe(true)
    expect(iconResponse.headers()['content-type']).toContain('image/png')
  }
})

test('keeps the game shell usable when service workers are blocked', async ({
  browser,
}) => {
  const context = await browser.newContext({ serviceWorkers: 'block' })
  const page = await context.newPage()

  await page.goto('/')

  await expect(page.getByRole('region', { name: '宠物画面' })).toBeVisible()
  await expect(page.getByText('蛋', { exact: true })).toBeVisible()

  await context.close()
})
