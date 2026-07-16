import { z } from 'zod'

// bcrypt only reads the first 72 bytes of a password, so longer input
// would silently truncate. The complexity floor is a letter plus a digit
// on top of the length minimum.
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/[0-9]/, 'Password must include a number')
