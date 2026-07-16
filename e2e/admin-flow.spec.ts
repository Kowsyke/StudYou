import { expect, test } from '@playwright/test'

// The admin lifecycle: sign in, create a knowledge base resource, see it
// in the library, edit it, and delete it. Cleans up after itself so the
// suite is repeatable against the same seed. Requires the seeded database.

const CREATED_TITLE = 'E2E temporary resource'
const EDITED_TITLE = 'E2E temporary resource edited'

test('admin creates, sees, edits and deletes a resource', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', 'admin@studyou.app')
  await page.fill('#password', 'AdminPass123')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('heading', { name: 'Insights' })).toBeVisible()

  // Create
  await page.fill('#kb-title', CREATED_TITLE)
  await page.fill('#kb-summary', 'Temporary entry created by the e2e suite.')
  await page.selectOption('#kb-category', 'documents')
  await page.fill('#kb-cost', '12.50')
  await page.fill('#kb-source', 'https://www.gov.uk/e2e-temporary')
  await page.getByRole('button', { name: 'Add resource' }).click()

  await expect(page.getByText('Resource saved.')).toBeVisible()
  await expect(page.getByRole('cell', { name: CREATED_TITLE, exact: true })).toBeVisible()

  // See it in the library
  await page.getByRole('link', { name: 'Resources' }).click()
  await page.getByPlaceholder('Search resources...').fill(CREATED_TITLE)
  await expect(page.getByRole('heading', { name: CREATED_TITLE })).toBeVisible()

  // Edit
  await page.getByRole('link', { name: 'Insights' }).click()
  await page.getByRole('button', { name: `Edit ${CREATED_TITLE}` }).click()
  await page.fill('#kb-title', EDITED_TITLE)
  await page.getByRole('button', { name: 'Save changes' }).click()

  await expect(page.getByText('Resource saved.').first()).toBeVisible()
  await expect(page.getByRole('cell', { name: EDITED_TITLE, exact: true })).toBeVisible()

  // Delete
  await page.getByRole('button', { name: `Delete ${EDITED_TITLE}` }).click()
  await expect(page.getByText('Resource removed.')).toBeVisible()
  await expect(page.getByRole('cell', { name: EDITED_TITLE, exact: true })).not.toBeVisible()
})
