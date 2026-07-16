import { expect, test } from '@playwright/test'

// Search, filter and sort on the resource library, driven through the UI
// against the seeded UK knowledge base. Requires the seeded database.

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', 'student@studyou.app')
  await page.fill('#password', 'StudentPass123')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /Hello, Demo/ })).toBeVisible()
  await page.getByRole('link', { name: 'Resources' }).click()
  await expect(page.getByRole('heading', { name: 'Resource library' })).toBeVisible()
  // Let the page settle before driving the filters: interacting within the
  // first few hundred milliseconds of the mount can race React StrictMode's
  // dev only effect churn and drop the query update (dev server only).
  await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible()
  await page.waitForTimeout(500)
})

test('search narrows the results', async ({ page }) => {
  const cards = page.getByRole('heading', { level: 3 })
  const allCount = await cards.count()
  expect(allCount).toBeGreaterThan(1)

  await page.getByPlaceholder('Search resources...').fill('IELTS')
  await expect(page.getByRole('heading', { name: /IELTS/ })).toBeVisible()
  await expect
    .poll(async () => cards.count(), { message: 'search should narrow the list' })
    .toBeLessThan(allCount)
})

test('category filter shows only that category', async ({ page }) => {
  await page.getByLabel('Filter by category').selectOption('visa')

  await expect(page.getByRole('heading', { name: 'Student visa application fee' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'UCAS application fee' })).not.toBeVisible()

  // Every visible card must carry the Visa category badge.
  const badges = page.locator('main').getByText('Visa', { exact: true })
  const cards = page.getByRole('heading', { level: 3 })
  expect(await badges.count()).toBe(await cards.count())
})

test('sort by cost orders results by price', async ({ page }) => {
  await page.getByLabel('Sort by').selectOption('cost')

  // Cheapest seeded resource first when ascending.
  await expect(page.getByRole('heading', { level: 3 }).first()).toHaveText('UCAS application fee')

  await page.getByRole('button', { name: /^Order/ }).click()
  await expect(page.getByRole('heading', { level: 3 }).first()).toHaveText(
    'Immigration Health Surcharge',
  )
})
