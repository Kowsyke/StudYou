import {
  adminNotes,
  bugReports,
  journeyTasks,
  journeys,
  stages,
  taskTemplates,
  users,
} from '@studyou/db'
import type {
  AdminAnalytics,
  AdminNote,
  AdminUser,
  ApiResponse,
  BugReport,
  ReportCategory,
  ReportStatus,
  Role,
  StageKey,
} from '@studyou/types'
import { asc, desc, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../lib/db'
import { validate } from '../lib/validate'
import { authMiddleware } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import type { AppEnv } from '../types'

const idParamSchema = z.object({ id: z.string().uuid('Invalid id') })

const updateUserSchema = z.object({
  suspended: z.boolean(),
})

const updateReportSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  adminNote: z.string().max(1000).nullable().optional(),
})

export const adminRoutes = new Hono<AppEnv>()

adminRoutes.use('*', authMiddleware, requireRole('admin'))

adminRoutes.get('/analytics', async (c) => {
  const [studentCount] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, 'student'))

  const [journeyCount] = await db.select({ value: sql<number>`count(*)::int` }).from(journeys)

  const [userTotals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${users.lastSeenAt} > now() - interval '5 minutes')::int`,
      activeToday: sql<number>`count(*) filter (where ${users.lastSeenAt} > now() - interval '24 hours')::int`,
      newThisWeek: sql<number>`count(*) filter (where ${users.createdAt} > now() - interval '7 days')::int`,
      suspended: sql<number>`count(*) filter (where ${users.suspended})::int`,
    })
    .from(users)

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
    activeUsers: userTotals?.active ?? 0,
    totalUsers: userTotals?.total ?? 0,
    newThisWeek: userTotals?.newThisWeek ?? 0,
    suspendedUsers: userTotals?.suspended ?? 0,
    activeToday: userTotals?.activeToday ?? 0,
  }
  const response: ApiResponse<AdminAnalytics> = { success: true, data: analytics }
  return c.json(response)
})

// Every account with journey completion and open report counts, newest
// first, for the user control table.
adminRoutes.get('/users', async (c) => {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      suspended: users.suspended,
      createdAt: users.createdAt,
      totalTasks: sql<number>`count(${journeyTasks.id})::int`,
      doneTasks: sql<number>`count(${journeyTasks.id}) filter (where ${journeyTasks.status} = 'done')::int`,
      openReports: sql<number>`(select count(*)::int from ${bugReports} where ${bugReports.userId} = ${users.id} and ${bugReports.status} != 'resolved')`,
    })
    .from(users)
    .leftJoin(journeys, eq(journeys.userId, users.id))
    .leftJoin(journeyTasks, eq(journeyTasks.journeyId, journeys.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))

  const data: AdminUser[] = rows.map((r) => ({
    id: r.id,
    email: r.email,
    fullName: r.fullName,
    role: r.role as Role,
    suspended: r.suspended,
    createdAt: r.createdAt.toISOString(),
    percentComplete: r.totalTasks === 0 ? null : Math.round((r.doneTasks / r.totalTasks) * 100),
    openReports: r.openReports,
  }))
  const response: ApiResponse<AdminUser[]> = { success: true, data }
  return c.json(response)
})

// Suspend or reinstate an account. Admins cannot suspend themselves so
// there is always a way back in.
adminRoutes.patch(
  '/users/:id',
  validate('param', idParamSchema),
  validate('json', updateUserSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const { suspended } = c.req.valid('json')
    if (id === c.get('user').sub) {
      return c.json({ success: false, error: 'You cannot suspend your own account' }, 400)
    }
    const [updated] = await db
      .update(users)
      .set({ suspended })
      .where(eq(users.id, id))
      .returning({ id: users.id, suspended: users.suspended })
    if (!updated) return c.json({ success: false, error: 'User not found' }, 404)
    const response: ApiResponse<{ id: string; suspended: boolean }> = {
      success: true,
      data: updated,
    }
    return c.json(response)
  },
)

adminRoutes.get('/reports', async (c) => {
  const rows = await db
    .select({
      id: bugReports.id,
      userId: bugReports.userId,
      userEmail: users.email,
      userName: users.fullName,
      category: bugReports.category,
      message: bugReports.message,
      pagePath: bugReports.pagePath,
      status: bugReports.status,
      adminNote: bugReports.adminNote,
      createdAt: bugReports.createdAt,
      updatedAt: bugReports.updatedAt,
    })
    .from(bugReports)
    .leftJoin(users, eq(bugReports.userId, users.id))
    .orderBy(desc(bugReports.createdAt))

  const data: BugReport[] = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userEmail: r.userEmail,
    userName: r.userName,
    category: r.category as ReportCategory,
    message: r.message,
    pagePath: r.pagePath,
    status: r.status as ReportStatus,
    adminNote: r.adminNote,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))
  const response: ApiResponse<BugReport[]> = { success: true, data }
  return c.json(response)
})

adminRoutes.patch(
  '/reports/:id',
  validate('param', idParamSchema),
  validate('json', updateReportSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const changes: Partial<{ status: ReportStatus; adminNote: string | null; updatedAt: Date }> = {
      updatedAt: new Date(),
    }
    if (body.status !== undefined) changes.status = body.status
    if (body.adminNote !== undefined) changes.adminNote = body.adminNote
    const [updated] = await db
      .update(bugReports)
      .set(changes)
      .where(eq(bugReports.id, id))
      .returning({ id: bugReports.id })
    if (!updated) return c.json({ success: false, error: 'Report not found' }, 404)
    return c.json({ success: true, message: 'Report updated' })
  },
)

const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.enum(['bug', 'feature', 'data', 'general']),
  author: z.string().min(1).max(100),
})

adminRoutes.get('/notes', async (c) => {
  const rows = await db.select().from(adminNotes).orderBy(desc(adminNotes.createdAt))
  const data: AdminNote[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    priority: r.priority as 'low' | 'medium' | 'high',
    category: r.category as 'bug' | 'feature' | 'data' | 'general',
    author: r.author,
    createdAt: r.createdAt.toISOString(),
  }))
  const response: ApiResponse<AdminNote[]> = { success: true, data }
  return c.json(response)
})

adminRoutes.post('/notes', validate('json', createNoteSchema), async (c) => {
  const body = c.req.valid('json')
  const [row] = await db
    .insert(adminNotes)
    .values({
      title: body.title,
      content: body.content,
      priority: body.priority,
      category: body.category,
      author: body.author,
    })
    .returning()

  const data: AdminNote = {
    id: row.id,
    title: row.title,
    content: row.content,
    priority: row.priority as 'low' | 'medium' | 'high',
    category: row.category as 'bug' | 'feature' | 'data' | 'general',
    author: row.author,
    createdAt: row.createdAt.toISOString(),
  }
  const response: ApiResponse<AdminNote> = { success: true, data }
  return c.json(response, 201)
})

adminRoutes.delete('/notes/:id', validate('param', idParamSchema), async (c) => {
  const { id } = c.req.valid('param')
  const [deleted] = await db
    .delete(adminNotes)
    .where(eq(adminNotes.id, id))
    .returning({ id: adminNotes.id })
  if (!deleted) return c.json({ success: false, error: 'Note not found' }, 404)
  return c.json({ success: true, message: 'Note deleted' })
})
