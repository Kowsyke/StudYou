import type { DeadlineItem, StageKey, TaskStatus } from '@studyou/types'

/**
 * Works backwards from the intake date. A task with daysBeforeIntake of 75
 * gets a target date 75 days before intake. Negative values mean the task
 * happens after arrival, for example minus 14 is two weeks into the stay.
 * Dates are handled as plain ISO date strings at UTC to avoid timezone drift.
 */
export function computeTargetDate(intakeDate: string, daysBeforeIntake: number): string {
  const intake = parseIsoDate(intakeDate)
  const target = new Date(intake.getTime())
  target.setUTCDate(target.getUTCDate() - daysBeforeIntake)
  return toIsoDate(target)
}

export interface PlannableTask {
  id: string
  daysBeforeIntake: number
}

export function planDeadlines(intakeDate: string, tasks: PlannableTask[]): Map<string, string> {
  const plan = new Map<string, string>()
  for (const task of tasks) {
    plan.set(task.id, computeTargetDate(intakeDate, task.daysBeforeIntake))
  }
  return plan
}

export interface DeadlineTask {
  taskId: string
  title: string
  stageKey: StageKey
  targetDate: string
  status: TaskStatus
}

/**
 * Returns the next pending deadlines from a reference date, soonest first.
 * Overdue pending tasks are included with a negative daysLeft so the
 * student sees what has slipped.
 */
export function upcomingDeadlines(tasks: DeadlineTask[], from: string, limit = 5): DeadlineItem[] {
  const reference = parseIsoDate(from).getTime()
  return tasks
    .filter((t) => t.status === 'pending')
    .map((t) => ({
      taskId: t.taskId,
      title: t.title,
      stageKey: t.stageKey,
      targetDate: t.targetDate,
      daysLeft: Math.round((parseIsoDate(t.targetDate).getTime() - reference) / 86400000),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, limit)
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) throw new Error(`Invalid ISO date: ${value}`)
  return new Date(Date.UTC(year, month - 1, day))
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
