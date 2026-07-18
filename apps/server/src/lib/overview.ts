import {
  categories,
  countries,
  exchangeRates,
  journeyTasks,
  journeys,
  stages,
  taskTemplates,
  users,
} from '@studyou/db'
import { computeBudget, upcomingDeadlines } from '@studyou/engine'
import type {
  CategoryKey,
  CostType,
  JourneyOverview,
  JourneyTask,
  StageKey,
  StageProgress,
  TaskStatus,
} from '@studyou/types'
import { asc, eq } from 'drizzle-orm'
import { db } from './db'

export async function buildOverview(userId: string): Promise<JourneyOverview | null> {
  const [journey] = await db.select().from(journeys).where(eq(journeys.userId, userId)).limit(1)
  if (!journey) return null

  const stageRows = await db
    .select()
    .from(stages)
    .where(eq(stages.countryId, journey.countryId))
    .orderBy(asc(stages.orderIndex))

  const taskRows = await db
    .select({
      id: journeyTasks.id,
      journeyId: journeyTasks.journeyId,
      templateId: journeyTasks.templateId,
      status: journeyTasks.status,
      targetDate: journeyTasks.targetDate,
      completedAt: journeyTasks.completedAt,
      title: taskTemplates.title,
      description: taskTemplates.description,
      costPence: taskTemplates.costPence,
      costType: taskTemplates.costType,
      sourceUrl: taskTemplates.sourceUrl,
      stageId: taskTemplates.stageId,
      stageKey: stages.key,
      categoryKey: categories.key,
      orderIndex: taskTemplates.orderIndex,
    })
    .from(journeyTasks)
    .innerJoin(taskTemplates, eq(journeyTasks.templateId, taskTemplates.id))
    .innerJoin(stages, eq(taskTemplates.stageId, stages.id))
    .innerJoin(categories, eq(taskTemplates.categoryId, categories.id))
    .where(eq(journeyTasks.journeyId, journey.id))
    .orderBy(asc(stages.orderIndex), asc(taskTemplates.orderIndex))

  const homeRate = await findHomeRate(userId)

  const budget = computeBudget(
    taskRows.map((t) => ({
      costPence: t.costPence,
      costType: t.costType as CostType,
      status: t.status as TaskStatus,
    })),
    journey.budgetPence,
    homeRate,
  )

  const today = new Date().toISOString().slice(0, 10)
  const deadlines = upcomingDeadlines(
    taskRows.map((t) => ({
      taskId: t.id,
      title: t.title,
      stageKey: t.stageKey as StageKey,
      targetDate: t.targetDate,
      status: t.status as TaskStatus,
    })),
    today,
    5,
  )

  const toJourneyTask = (t: (typeof taskRows)[number]): JourneyTask => ({
    id: t.id,
    journeyId: t.journeyId,
    templateId: t.templateId,
    status: t.status as TaskStatus,
    targetDate: t.targetDate,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    title: t.title,
    description: t.description,
    stageKey: t.stageKey as StageKey,
    categoryKey: t.categoryKey as CategoryKey,
    costPence: t.costPence,
    costType: t.costType as CostType,
    sourceUrl: t.sourceUrl,
  })

  const stageProgress: StageProgress[] = stageRows.map((stage) => {
    const tasks = taskRows.filter((t) => t.stageId === stage.id).map(toJourneyTask)
    return {
      stage: {
        id: stage.id,
        countryId: stage.countryId,
        key: stage.key as StageKey,
        title: stage.title,
        description: stage.description,
        orderIndex: stage.orderIndex,
      },
      tasks,
      done: tasks.filter((t) => t.status === 'done').length,
      total: tasks.length,
    }
  })

  const total = taskRows.length
  const done = taskRows.filter((t) => t.status === 'done').length

  return {
    journey: {
      id: journey.id,
      userId: journey.userId,
      countryId: journey.countryId,
      intakeDate: journey.intakeDate,
      courseLevel: journey.courseLevel,
      budgetPence: journey.budgetPence,
      major: journey.major,
      regions: journey.regions ? journey.regions.split(',') : [],
      educationCompleted: journey.educationCompleted,
      createdAt: journey.createdAt.toISOString(),
    },
    stages: stageProgress,
    percentComplete: total === 0 ? 0 : Math.round((done / total) * 100),
    budget,
    upcomingDeadlines: deadlines,
  }
}

async function findHomeRate(userId: string) {
  const [row] = await db
    .select({ currencyCode: countries.currencyCode, ratePerGbp: exchangeRates.ratePerGbp })
    .from(users)
    .innerJoin(countries, eq(users.originCountryId, countries.id))
    .innerJoin(exchangeRates, eq(exchangeRates.currencyCode, countries.currencyCode))
    .where(eq(users.id, userId))
    .limit(1)

  if (!row) return null
  return { currencyCode: row.currencyCode, ratePerGbp: Number(row.ratePerGbp) }
}
