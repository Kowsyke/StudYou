import { expect, test } from '@playwright/test'

// RBAC is enforced at the API layer, so these tests talk to the API
// directly through the Vite proxy: a student token on an admin route gets
// 403, and no token at all gets 401. Requires the seeded database.

test('unauthenticated requests receive 401', async ({ request }) => {
  const analytics = await request.get('/api/v1/admin/analytics')
  expect(analytics.status()).toBe(401)

  const journey = await request.get('/api/v1/journey')
  expect(journey.status()).toBe(401)

  const body = await analytics.json()
  expect(body.success).toBe(false)
})

test('a student token on an admin route receives 403', async ({ request }) => {
  const login = await request.post('/api/v1/auth/login', {
    data: { email: 'student@studyou.app', password: 'StudentPass123' },
  })
  expect(login.ok()).toBeTruthy()
  const { data } = await login.json()

  const analytics = await request.get('/api/v1/admin/analytics', {
    headers: { Authorization: `Bearer ${data.token}` },
  })
  expect(analytics.status()).toBe(403)

  const create = await request.post('/api/v1/resources', {
    headers: { Authorization: `Bearer ${data.token}` },
    data: {
      categoryKey: 'visa',
      title: 'Should be forbidden',
      summary: 'A student must not be able to create resources.',
      costPence: null,
      deadlineDaysBeforeIntake: null,
      sourceUrl: 'https://www.gov.uk/student-visa',
    },
  })
  expect(create.status()).toBe(403)
})

test('a garbled token receives 401', async ({ request }) => {
  const response = await request.get('/api/v1/journey', {
    headers: { Authorization: 'Bearer not-a-real-token' },
  })
  expect(response.status()).toBe(401)
})
