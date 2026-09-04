import { env } from '@/config/env'
import { httpClient } from '@/lib/http'
import { toUserProfile } from '@/lib/normalize'
import { mockExperts } from './mocks/mockApi'

export const expertsService = {
  async listExperts(page = 1, pageSize = 20) {
    if (env.useMocks) return mockExperts.listExperts(page, pageSize)
    const users = await httpClient.get(`/users?role=expert&page=${page}&per_page=${pageSize}`)
    return { items: users.map(toUserProfile), page, pageSize }
  },

  async getExpert(userId) {
    if (env.useMocks) return mockExperts.getExpert(userId)
    const user = await httpClient.get(`/users/${userId}`)
    return toUserProfile(user)
  },

  async getMyFollowing() {
    if (env.useMocks) return mockExperts.getMyFollowing()
    const result = await httpClient.get('/users/me/following')
    return { followingIds: result.following_ids }
  },

  async getFollowersCount(userId) {
    if (env.useMocks) return mockExperts.getFollowersCount(userId)
    const result = await httpClient.get(`/users/${userId}/followers/count`)
    return result.count
  },

  async getFollowSummary(userId) {
    if (env.useMocks) return mockExperts.getFollowSummary(userId)
    const [following, followersCount] = await Promise.all([
      this.getMyFollowing(),
      this.getFollowersCount(userId),
    ])
    return { followingCount: following.followingIds.length, followersCount, followingIds: following.followingIds }
  },

  // The backend has separate follow/unfollow endpoints, not a toggle --
  // expertsSlice already knows the current state and calls the right one.
  async followUser(userId) {
    if (env.useMocks) return mockExperts.toggleFollow(userId)
    return httpClient.post(`/users/${userId}/follow`, {})
  },

  async unfollowUser(userId) {
    if (env.useMocks) return mockExperts.toggleFollow(userId)
    return httpClient.delete(`/users/${userId}/follow`)
  },
}
