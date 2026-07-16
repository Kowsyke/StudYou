import { describe, expect, test } from 'bun:test'
import { passwordSchema } from './password'

describe('passwordSchema', () => {
  test('accepts a compliant password', () => {
    expect(passwordSchema.safeParse('Sturdy1234').success).toBe(true)
  })

  test('rejects passwords under 8 characters', () => {
    const result = passwordSchema.safeParse('Ab1')
    expect(result.success).toBe(false)
  })

  test('rejects passwords without a letter', () => {
    expect(passwordSchema.safeParse('12345678').success).toBe(false)
  })

  test('rejects passwords without a number', () => {
    expect(passwordSchema.safeParse('OnlyLetters').success).toBe(false)
  })

  test('rejects passwords over 72 characters because bcrypt truncates', () => {
    expect(passwordSchema.safeParse(`A1${'x'.repeat(71)}`).success).toBe(false)
  })

  test('accepts exactly 8 characters with a letter and a number', () => {
    expect(passwordSchema.safeParse('abcdefg1').success).toBe(true)
  })
})
