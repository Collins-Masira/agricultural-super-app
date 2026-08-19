import { env } from '@/config/env'
import { httpClient } from '@/lib/http'
import { AuthSession, UserProfile } from '@/types/domain'
import { mockAuth, mockSession } from './mocks/mockApi'

/**
 * Authentication service.
 * NOTE: the real endpoint paths below follow a conventional REST shape and
 * MUST be confirmed against the backend team's actual API contract before
 * they are enabled.
 */
export const authService = {
  async login(usernameOrEmail: string, password: string): Promise<AuthSession> {
    if (env.useMocks) return mockAuth.login(usernameOrEmail, password)
    return httpClient.post<AuthSession>('/auth/login', { usernameOrEmail, password })
  },

  async register(input: {
    username: string
    email: string
    password: string
    firstName?: string
    lastName?: string
  }): Promise<AuthSession> {
    if (env.useMocks) return mockAuth.register(input)
    return httpClient.post<AuthSession>('/auth/register', input)
  },

  async me(): Promise<UserProfile> {
    if (env.useMocks) return mockSession.me(1)
    return httpClient.get<UserProfile>('/auth/me')
  },
}