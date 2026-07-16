import { expect, test } from '@playwright/test'

// The vertical slice: a seeded student signs in, sees the five stage journey,
// ticks a task off, and the dashboard percent updates live.
// Requires the database to be migrated and seeded (pnpm bootstrap).

test('student logs in, ticks a task and the dashboard updates live', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', 'student@studyou.app')
  await page.fill('#password', 'StudentPass123')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('heading', { name: /Hello, Demo/ })).toBeVisible()
  const percentBefore = Number.parseInt(await page.getByTestId('percent-complete').innerText(), 10)

  await page.getByRole('link', { name: 'My journey' }).click()
  await expect(page.getByRole('heading', { name: 'My journey' })).toBeVisible()

  const firstPending = page.getByRole('button', { name: /^Mark .* as done$/ }).first()
  const pendingLabel = await firstPending.getAttribute('aria-label')
  if (!pendingLabel) throw new Error('No pending task found, reseed the database')
  const doneLabel = pendingLabel.replace(/ as done$/, ' as pending')

  await firstPending.click()
  await expect(page.getByRole('button', { name: doneLabel })).toBeVisible()

  await page.getByRole('link', { name: 'Dashboard' }).click()
  await expect(page.getByTestId('percent-complete')).toBeVisible()
  const percentAfter = Number.parseInt(await page.getByTestId('percent-complete').innerText(), 10)
  expect(percentAfter).toBeGreaterThan(percentBefore)

  // Untick the task so the test is repeatable against the same seed data.
  await page.getByRole('link', { name: 'My journey' }).click()
  await page.getByRole('button', { name: doneLabel }).click()
  await expect(page.getByRole('button', { name: pendingLabel })).toBeVisible()
})
