export type Role = 'student' | 'admin'

export type StageKey = 'prepare' | 'apply' | 'visa' | 'predeparture' | 'arrive'

export type CategoryKey = 'visa' | 'health' | 'finance' | 'housing' | 'documents' | 'arrival'

export type CostType = 'mandatory' | 'optional' | 'none'

export type TaskStatus = 'pending' | 'done'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  originCountryId: string | null
  createdAt: string
}

export interface AuthPayload {
  user: User
  token: string
}

export interface Country {
  id: string
  code: string
  name: string
  currencyCode: string
  isDestination: boolean
}

export interface Category {
  id: string
  key: CategoryKey
  label: string
}

export interface Stage {
  id: string
  countryId: string
  key: StageKey
  title: string
  description: string
  orderIndex: number
}

export interface TaskTemplate {
  id: string
  countryId: string
  stageId: string
  categoryId: string
  title: string
  description: string
  costPence: number | null
  costType: CostType
  daysBeforeIntake: number
  sourceUrl: string | null
  lastUpdated: string
  orderIndex: number
}

export interface Resource {
  id: string
  countryId: string
  categoryId: string
  categoryKey: CategoryKey
  title: string
  summary: string
  costPence: number | null
  deadlineDaysBeforeIntake: number | null
  sourceUrl: string
  lastUpdated: string
}

export interface ResourceInput {
  categoryKey: CategoryKey
  title: string
  summary: string
  costPence: number | null
  deadlineDaysBeforeIntake: number | null
  sourceUrl: string
}

export interface Journey {
  id: string
  userId: string
  countryId: string
  intakeDate: string
  courseLevel: string
  budgetPence: number
  createdAt: string
}

export interface JourneyTask {
  id: string
  journeyId: string
  templateId: string
  status: TaskStatus
  targetDate: string
  completedAt: string | null
  title: string
  description: string
  stageKey: StageKey
  categoryKey: CategoryKey
  costPence: number | null
  costType: CostType
  sourceUrl: string | null
}

export interface BudgetSummary {
  mandatoryPence: number
  optionalPence: number
  totalPence: number
  spentPence: number
  remainingPence: number
  budgetPence: number
  overBudget: boolean
  homeCurrencyCode: string | null
  ratePerGbp: number | null
  totalHome: number | null
  spentHome: number | null
}

export interface DeadlineItem {
  taskId: string
  title: string
  stageKey: StageKey
  targetDate: string
  daysLeft: number
}

export interface StageProgress {
  stage: Stage
  tasks: JourneyTask[]
  done: number
  total: number
}

export interface JourneyOverview {
  journey: Journey
  stages: StageProgress[]
  percentComplete: number
  budget: BudgetSummary
  upcomingDeadlines: DeadlineItem[]
}

export interface StageAnalytics {
  stageKey: StageKey
  stageTitle: string
  totalTasks: number
  completedTasks: number
  completionRate: number
}

export interface AdminAnalytics {
  totalStudents: number
  totalJourneys: number
  averageCompletion: number
  stageBreakdown: StageAnalytics[]
  dropOff: { stageKey: StageKey; stageTitle: string; studentsReached: number }[]
}
