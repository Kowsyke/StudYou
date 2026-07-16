import { zValidator } from '@hono/zod-validator'
import type { ValidationTargets } from 'hono'
import type { ZodSchema } from 'zod'

/**
 * Wraps zValidator so every validation failure returns the shared
 * ApiResponse envelope with one human readable message instead of the
 * raw zod issue list. Nothing internal ever leaks to the client.
 */
export function validate<T extends ZodSchema, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const issue = result.error.issues[0]
      const path = issue?.path.join('.')
      const message = issue
        ? path
          ? `${path}: ${issue.message}`
          : issue.message
        : 'Invalid request'
      return c.json({ success: false, error: message }, 400)
    }
  })
}
