import { describe, expect, it } from 'vitest'
import { computeBudget } from './budget'

const tasks = [
  { costPence: 52400, costType: 'mandatory' as const, status: 'done' as const },
  { costPence: 77600, costType: 'mandatory' as const, status: 'pending' as const },
  { costPence: 50000, costType: 'optional' as const, status: 'pending' as const },
  { costPence: null, costType: 'none' as const, status: 'pending' as const },
  { costPence: 0, costType: 'mandatory' as const, status: 'pending' as const },
]

describe('computeBudget', () => {
  it('aggregates mandatory and optional costs into a total', () => {
    const budget = computeBudget(tasks, 200000)
    expect(budget.mandatoryPence).toBe(130000)
    expect(budget.optionalPence).toBe(50000)
    expect(budget.totalPence).toBe(180000)
  })

  it('tracks spent as the cost of completed tasks', () => {
    const budget = computeBudget(tasks, 200000)
    expect(budget.spentPence).toBe(52400)
    expect(budget.remainingPence).toBe(127600)
  })

  it('flags when the projected total exceeds the student budget', () => {
    expect(computeBudget(tasks, 100000).overBudget).toBe(true)
    expect(computeBudget(tasks, 200000).overBudget).toBe(false)
    expect(computeBudget(tasks, 0).overBudget).toBe(false)
  })

  it('converts totals to the home currency when a rate is given', () => {
    const budget = computeBudget(tasks, 200000, { currencyCode: 'BDT', ratePerGbp: 155 })
    expect(budget.homeCurrencyCode).toBe('BDT')
    expect(budget.totalHome).toBe(279000)
    expect(budget.spentHome).toBe(81220)
  })

  it('handles an empty journey', () => {
    const budget = computeBudget([], 0)
    expect(budget.totalPence).toBe(0)
    expect(budget.spentPence).toBe(0)
    expect(budget.overBudget).toBe(false)
    expect(budget.totalHome).toBeNull()
  })
})
