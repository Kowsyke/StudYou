import * as schema from '@studyou/db'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { env } from './env'

const sql = neon(env.databaseUrl)

export const db = drizzle(sql, { schema })
