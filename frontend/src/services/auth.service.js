import { env } from '@/config/env'
import { httpClient } from '@/lib/http'
import { mockAuth, mockSession } from './mocks/mockApi'

/**
 * Authentication service.
 * NOTE: the real endpoint paths below follow a conventional REST shape and
 * MUST be confirmed against the backend team's actual API contract before
 * they are enabled.
 */
export const authService = {
  async login(usernameOrEmail, password) {
    if (env.useMocks) return mockAuth.login(usernameOrEmail, password)
    return httpClient.post('/auth/login', { usernameOrEmail, password })
  },

  async register(input) {
    if (env.useMocks) return mockAuth.register(input)
    return httpClient.post('/auth/register', input)
  },

  async me() {
    if (env.useMocks) return mockSession.me(1)
    return httpClient.get('/auth/me')
  },
}