import { env } from '@/config/env'
import { httpClient } from '@/lib/http'
import { mockExperts } from './mocks/mockApi'

export const expertsService = {
  async listExperts(page = 1, pageSize = 20) {
    if (env.useMocks) return mockExperts.listExperts(page, pageSize)
    return httpClient.get(`/experts?page=${page}&pageSize=${pageSize}`)
  },

  async getExpert(userId) {
    if (env.useMocks) return mockExperts.getExpert(userId)
    return httpClient.get(`/experts/${userId}`)
  },

  async getMyFollowing() {
    if (env.useMocks) return mockExperts.getMyFollowing()
    return httpClient.get('/me/following')
  },

  async getFollowersCount(userId) {
    if (env.useMocks) return mockExperts.getFollowersCount(userId)
    return httpClient.get(`/users/${userId}/followers/count`)
  },

  async getFollowSummary(userId) {
    if (env.useMocks) return mockExperts.getFollowSummary(userId)
    return httpClient.get(`/users/${userId}/follow`)
  },

  async toggleFollow(userId) {
    if (env.useMocks) return mockExperts.toggleFollow(userId)
    return httpClient.post(`/users/${userId}/follow`, {})
  },
}