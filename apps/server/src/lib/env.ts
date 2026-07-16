import { config } from 'dotenv'

config({ path: new URL('../../../../.env', import.meta.url).pathname })

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/studyou',
  jwtSecret: process.env.JWT_SECRET ?? 'dev_only_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  port: Number(process.env.PORT) || 3000,
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
}
