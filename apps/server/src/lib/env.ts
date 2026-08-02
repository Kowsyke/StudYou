import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'

config({ path: fileURLToPath(new URL('../../../../.env', import.meta.url)) })

// Anything that is not an explicit development or test run is treated as
// production, where secrets must be provided and there is no safe default.
// The deploy MUST set NODE_ENV=production for this gate to apply.
//
// Read via bracket access, not process.env.NODE_ENV: bundlers (bun build,
// esbuild) statically inline the dot form at build time, which would freeze
// this to the builder's value and silently disable the production gate in the
// deployed bundle. Bracket access is left as a real runtime read.
const nodeEnv = process.env['NODE_ENV'] ?? 'development'
const isProduction = nodeEnv === 'production'

/**
 * Reads a required setting. In development it falls back to a local default
 * so the app runs with no .env. In production a missing value throws at
 * startup, so a misconfigured deploy fails loudly instead of silently
 * running on a public, source-controlled default (for example the JWT
 * signing secret, which would otherwise let anyone forge admin tokens).
 */
function fromEnv(name: string, devFallback: string): string {
  const value = process.env[name]
  if (value && value.length > 0) return value
  if (isProduction) {
    throw new Error(
      `${name} is not set. In production it must be provided explicitly; refusing to start on an insecure default.`,
    )
  }
  return devFallback
}

export const env = {
  databaseUrl: fromEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/studyou'),
  jwtSecret: fromEnv('JWT_SECRET', 'dev_only_secret_change_me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  port: Number(process.env.PORT || process.env.WEBSITES_PORT) || 3000,
  clientUrl: fromEnv('CLIENT_URL', 'http://localhost:5173'),
}
