import { env } from '@/config/env'
import { httpClient } from '@/lib/http'
import { Profile, UserProfile } from '@/types/domain'
import { mockProfiles } from './mocks/mockApi'

export const profileService = {
  async getProfile(userId: number): Promise<UserProfile> {
    if (env.useMocks) return mockProfiles.getProfile(userId)
    return httpClient.get<UserProfile>(`/profiles/${userId}`)
  },

  async myProfile(userId: number): Promise<UserProfile> {
    if (env.useMocks) return mockProfiles.myProfile(userId)
    return httpClient.get<UserProfile>('/profiles/me')
  },

  async updateProfile(userId: number, input: Partial<Profile>): Promise<UserProfile> {
    if (env.useMocks) return mockProfiles.updateProfile(userId, input)
    return httpClient.patch<UserProfile>(`/profiles/${userId}`, input)
  },
}