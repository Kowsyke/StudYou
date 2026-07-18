import { expect, test } from '@playwright/test'

// The admin lifecycle: sign in, create a knowledge base resource, edit it
// and delete it, all through the admin Knowledge Base manager. Cleans up
// after itself so the suite is repeatable. Requires the seeded database.
// The admin panel uses URL based tabs (/admin/kb), so navigation is by
// direct route rather than in page tab buttons.

const CREATED_TITLE = 'E2E temporary resource'
const EDITED_TITLE = 'E2E temporary resource edited'

// Failed earlier runs can leave the temporary resource behind, which then
// poisons the cost sort spec. Sweep any orphans through the API first.
test.beforeEach(async ({ request }) => {
  const login = await request.post('/api/v1/auth/login', {
    data: { email: 'admin@studyou.app', password: 'AdminPass123' },
  })
  const { data } = await login.json()
  const list = await request.get('/api/v1/resources?search=E2E', {
    headers: { Authorization: `Bearer ${data.token}` },
  })
  const body = await list.json()
  for (const resource of body.data ?? []) {
    await request.delete(`/api/v1/resources/${resource.id}`, {
      headers: { Authorization: `Bearer ${data.token}` },
    })
  }
})

test('admin creates, edits and deletes a knowledge base resource', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', 'admin@studyou.app')
  await page.fill('#password', 'AdminPass123')
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Lands on the admin insights dashboard.
  await expect(page.getByRole('heading', { name: 'Admin Insights' })).toBeVisible()

  // Open the Knowledge Base manager tab by its route.
  await page.goto('/admin/kb')
  await expect(page.locator('#kb-title')).toBeVisible()
  await page.waitForTimeout(500)

  // Create
  await page.fill('#kb-title', CREATED_TITLE)
  await page.fill('#kb-summary', 'Temporary entry created by the e2e suite.')
  await page.selectOption('#kb-category', 'documents')
  await page.fill('#kb-cost', '12.50')
  await page.fill('#kb-source', 'https://www.gov.uk/e2e-temporary')
  await page.getByRole('button', { name: 'Add resource' }).click()

  await expect(page.getByText('Resource saved.')).toBeVisible()
  await expect(page.getByRole('cell', { name: CREATED_TITLE, exact: true })).toBeVisible()

  // Edit
  await page.getByRole('button', { name: `Edit ${CREATED_TITLE}` }).click()
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible()
  await page.fill('#kb-title', EDITED_TITLE)
  await page.getByRole('button', { name: 'Save changes' }).click()

  await expect(page.getByText('Resource saved.').first()).toBeVisible()
  await expect(page.getByRole('cell', { name: EDITED_TITLE, exact: true })).toBeVisible()

  // Delete
  await page.getByRole('button', { name: `Delete ${EDITED_TITLE}` }).click()
  await expect(page.getByText('Resource removed.')).toBeVisible()
  await expect(page.getByRole('cell', { name: EDITED_TITLE, exact: true })).not.toBeVisible()
})
