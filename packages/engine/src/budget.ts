import type { BudgetSummary, CostType, TaskStatus } from '@studyou/types'

export interface BudgetTask {
  costPence: number | null
  costType: CostType
  status: TaskStatus
}

export interface HomeRate {
  currencyCode: string
  ratePerGbp: number
}

/**
 * Aggregates every cost on a journey into a live running total.
 * All arithmetic is integer pence so there are no floating point errors.
 * Mandatory and optional costs both count toward the projected total,
 * because the goal is transparency about the true total cost.
 * Spent is the sum of costs on tasks the student has already completed.
 */
export function computeBudget(
  tasks: BudgetTask[],
  budgetPence: number,
  homeRate: HomeRate | null = null,
): BudgetSummary {
  let mandatoryPence = 0
  let optionalPence = 0
  let spentPence = 0

  for (const task of tasks) {
    const cost = task.costPence ?? 0
    if (cost <= 0 || task.costType === 'none') continue
    if (task.costType === 'mandatory') mandatoryPence += cost
    else optionalPence += cost
    if (task.status === 'done') spentPence += cost
  }

  const totalPence = mandatoryPence + optionalPence
  const remainingPence = totalPence - spentPence
  const toHome = (pence: number) =>
    homeRate ? Math.round((pence / 100) * homeRate.ratePerGbp * 100) / 100 : null

  return {
    mandatoryPence,
    optionalPence,
    totalPence,
    spentPence,
    remainingPence,
    budgetPence,
    overBudget: budgetPence > 0 && totalPence > budgetPence,
    homeCurrencyCode: homeRate?.currencyCode ?? null,
    ratePerGbp: homeRate?.ratePerGbp ?? null,
    totalHome: toHome(totalPence),
    spentHome: toHome(spentPence),
  }
}
