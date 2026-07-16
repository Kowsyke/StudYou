import type { TokenPayload } from './lib/jwt'

export interface AppEnv {
  Variables: {
    user: TokenPayload
  }
}
