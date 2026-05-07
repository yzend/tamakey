import { expect, test, type Page } from '@playwright/test'

test('fake login collects a caretaker name and names the first pet', async ({
  page,
}) => {
  await resetBrowserSave(page)

  await expect(page.getByRole('heading', { name: '照护者登录' })).toBeVisible()
  await page.getByLabel('照护者名字').fill('阿钥')
  await page.getByRole('button', { name: '进入' }).click()

  await expect(page.getByRole('heading', { name: '给宠物命名' })).toBeVisible()
  await expect(page.getByText('欢迎，阿钥')).toBeVisible()
  await page.getByLabel('宠物名字').fill('泡泡')
  await page.getByRole('button', { name: '开始照护' }).click()

  await expect(page.getByRole('region', { name: '宠物画面' })).toBeVisible()
  await expect(page.getByText('泡泡')).toBeVisible()
  await page.getByRole('button', { name: /状态/ }).click()
  await expect(page.getByText('阿钥')).toBeVisible()
})

async function resetBrowserSave(page: Page) {
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
