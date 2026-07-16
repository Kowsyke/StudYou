import { describe, expect, it } from 'vitest'
import { computeTargetDate, planDeadlines, upcomingDeadlines } from './deadline'

describe('computeTargetDate', () => {
  it('works backwards from the intake date', () => {
    expect(computeTargetDate('2026-09-21', 75)).toBe('2026-07-08')
    expect(computeTargetDate('2026-09-21', 0)).toBe('2026-09-21')
  })

  it('handles negative days as after arrival', () => {
    expect(computeTargetDate('2026-09-21', -14)).toBe('2026-10-05')
  })

  it('crosses month and year boundaries correctly', () => {
    expect(computeTargetDate('2026-01-15', 30)).toBe('2025-12-16')
  })

  it('rejects malformed dates', () => {
    expect(() => computeTargetDate('not-a-date', 10)).toThrow()
  })
})

describe('planDeadlines', () => {
  it('maps every task id to a target date', () => {
    const plan = planDeadlines('2026-09-21', [
      { id: 'a', daysBeforeIntake: 300 },
      { id: 'b', daysBeforeIntake: -21 },
    ])
    expect(plan.get('a')).toBe('2025-11-25')
    expect(plan.get('b')).toBe('2026-10-12')
  })
})

describe('upcomingDeadlines', () => {
  const tasks = [
    {
      taskId: '1',
      title: 'Visa',
      stageKey: 'visa' as const,
      targetDate: '2026-07-08',
      status: 'pending' as const,
    },
    {
      taskId: '2',
      title: 'IHS',
      stageKey: 'visa' as const,
      targetDate: '2026-07-08',
      status: 'done' as const,
    },
    {
      taskId: '3',
      title: 'TB test',
      stageKey: 'visa' as const,
      targetDate: '2026-06-13',
      status: 'pending' as const,
    },
    {
      taskId: '4',
      title: 'Flights',
      stageKey: 'predeparture' as const,
      targetDate: '2026-08-07',
      status: 'pending' as const,
    },
  ]

  it('returns pending tasks soonest first and skips completed ones', () => {
    const items = upcomingDeadlines(tasks, '2026-07-01', 5)
    expect(items.map((i) => i.taskId)).toEqual(['3', '1', '4'])
  })

  it('marks overdue tasks with negative daysLeft', () => {
    const items = upcomingDeadlines(tasks, '2026-07-01', 5)
    expect(items[0].daysLeft).toBe(-18)
    expect(items[1].daysLeft).toBe(7)
  })

  it('respects the limit', () => {
    expect(upcomingDeadlines(tasks, '2026-07-01', 1)).toHaveLength(1)
  })
})
