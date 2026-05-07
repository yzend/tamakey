import { expect, type Page } from '@playwright/test'

export const TESTKIT_URL = '/?testkit=1'

export async function gotoTestKit(page: Page) {
  await page.goto(TESTKIT_URL)
  await expect(page.getByTestId('testkit-panel')).toBeAttached()
}
