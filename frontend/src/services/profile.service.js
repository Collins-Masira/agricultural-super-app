import { env } from '@/config/env'
import { httpClient } from '@/lib/http'
import { mockProfiles } from './mocks/mockApi'

export const profileService = {
  async getProfile(userId) {
    if (env.useMocks) return mockProfiles.getProfile(userId)
    return httpClient.get(`/profiles/${userId}`)
  },

  async myProfile(userId) {
    if (env.useMocks) return mockProfiles.myProfile(userId)
    return httpClient.get('/profiles/me')
  },

  async updateProfile(userId, input) {
    if (env.useMocks) return mockProfiles.updateProfile(userId, input)
    return httpClient.patch(`/profiles/${userId}`, input)
  },
}