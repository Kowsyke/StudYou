import type { Role } from '@studyou/types'
import jwt from 'jsonwebtoken'
import { env } from './env'

export interface TokenPayload {
  sub: string
  email: string
  role: Role
}

// Pin the algorithm on both sides. Signing already uses HS256 by default for
// a string secret; verifying with an explicit allowlist stops any future
// refactor (or a downgraded library) from silently accepting a different
// algorithm, including the "none" algorithm confusion attack.
const JWT_ALGORITHM = 'HS256' as const

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  })
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret, { algorithms: [JWT_ALGORITHM] })
  if (typeof decoded === 'string' || !decoded.sub) throw new Error('Malformed token')
  return decoded as unknown as TokenPayload
}
