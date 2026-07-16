import { journeyTasks, journeys, stages, taskTemplates, users } from '@studyou/db'
import type { AdminAnalytics, ApiResponse, StageKey } from '@studyou/types'
import { asc, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../lib/db'
import { authMiddleware } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import type { AppEnv } from '../types'

export const adminRoutes = new Hono<AppEnv>()

adminRoutes.use('*', authMiddleware, requireRole('admin'))

adminRoutes.get('/analytics', async (c) => {
  const [studentCount] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, 'student'))

  const [journeyCount] = await db.select({ value: sql<number>`count(*)::int` }).from(journeys)

  const breakdown = await db
    .select({
      stageKey: stages.key,
      stageTitle: stages.title,
      orderIndex: stages.orderIndex,
      totalTasks: sql<number>`count(${journeyTasks.id})::int`,
      completedTasks: sql<number>`count(${journeyTasks.id}) filter (where ${journeyTasks.status} = 'done')::int`,
      studentsReached: sql<number>`count(distinct ${journeyTasks.journeyId}) filter (where ${journeyTasks.status} = 'done')::int`,
    })
    .from(stages)
    .leftJoin(taskTemplates, eq(taskTemplates.stageId, stages.id))
    .leftJoin(journeyTasks, eq(journeyTasks.templateId, taskTemplates.id))
    .groupBy(stages.id, stages.key, stages.title, stages.orderIndex)
    .orderBy(asc(stages.orderIndex))

  const totalTasks = breakdown.reduce((sum, s) => sum + s.totalTasks, 0)
  const completedTasks = breakdown.reduce((sum, s) => sum + s.completedTasks, 0)

  const analytics: AdminAnalytics = {
    totalStudents: studentCount?.value ?? 0,
    totalJourneys: journeyCount?.value ?? 0,
    averageCompletion: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    stageBreakdown: breakdown.map((s) => ({
      stageKey: s.stageKey as StageKey,
      stageTitle: s.stageTitle,
      totalTasks: s.totalTasks,
      completedTasks: s.completedTasks,
      completionRate: s.totalTasks === 0 ? 0 : Math.round((s.completedTasks / s.totalTasks) * 100),
    })),
    dropOff: breakdown.map((s) => ({
      stageKey: s.stageKey as StageKey,
      stageTitle: s.stageTitle,
      studentsReached: s.studentsReached,
    })),
  }

  const response: ApiResponse<AdminAnalytics> = { success: true, data: analytics }
  return c.json(response)
})
