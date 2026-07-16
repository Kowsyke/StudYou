import type { Role } from '@studyou/types'
import jwt from 'jsonwebtoken'
import { env } from './env'

export interface TokenPayload {
  sub: string
  email: string
  role: Role
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  })
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret)
  if (typeof decoded === 'string' || !decoded.sub) throw new Error('Malformed token')
  return decoded as unknown as TokenPayload
}
