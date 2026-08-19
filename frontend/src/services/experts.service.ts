import { env } from '@/config/env'
import { httpClient } from '@/lib/http'
import { FollowSummary, Paginated, UserProfile } from '@/types/domain'
import { mockExperts } from './mocks/mockApi'

export const expertsService = {
  async listExperts(page = 1, pageSize = 20): Promise<Paginated<UserProfile>> {
    if (env.useMocks) return mockExperts.listExperts(page, pageSize)
    return httpClient.get<Paginated<UserProfile>>(`/experts?page=${page}&pageSize=${pageSize}`)
  },

  async getExpert(userId: number): Promise<UserProfile> {
    if (env.useMocks) return mockExperts.getExpert(userId)
    return httpClient.get<UserProfile>(`/experts/${userId}`)
  },

  async getMyFollowing(): Promise<{ followingIds: number[] }> {
    if (env.useMocks) return mockExperts.getMyFollowing()
    return httpClient.get<{ followingIds: number[] }>('/me/following')
  },

  async getFollowersCount(userId: number): Promise<number> {
    if (env.useMocks) return mockExperts.getFollowersCount(userId)
    return httpClient.get<number>(`/users/${userId}/followers/count`)
  },

  async getFollowSummary(userId: number): Promise<FollowSummary> {
    if (env.useMocks) return mockExperts.getFollowSummary(userId)
    return httpClient.get<FollowSummary>(`/users/${userId}/follow`)
  },

  async toggleFollow(userId: number): Promise<FollowSummary> {
    if (env.useMocks) return mockExperts.toggleFollow(userId)
    return httpClient.post<FollowSummary>(`/users/${userId}/follow`, {})
  },
}