import { httpClient } from '@/lib/http'
import { normalizeCommunity } from '@/lib/normalize'

export const communitiesService = {
  async listCommunities(page = 1, pageSize = 20) {
    const communities = await httpClient.get(`/communities?page=${page}&per_page=${pageSize}`)
    return { items: communities.map(normalizeCommunity), page, pageSize }
  },

  async getCommunity(id) {
    const community = await httpClient.get(`/communities/${id}`)
    return normalizeCommunity(community)
  },

  async createCommunity({ name, description, imageUrl }) {
    const community = await httpClient.post('/communities', {
      name,
      description: description || undefined,
      image_url: imageUrl || undefined,
    })
    return normalizeCommunity(community)
  },

  async updateCommunitySettings(id, settings) {
    const community = await httpClient.put(`/communities/${id}`, {
      posting_permission: settings.postingPermission,
      messaging_permission: settings.messagingPermission,
      comments_enabled: settings.commentsEnabled,
    })
    return normalizeCommunity(community)
  },

  async joinCommunity(id) {
    return httpClient.post(`/communities/${id}/members`, {})
  },

  async leaveCommunity(id) {
    return httpClient.delete(`/communities/${id}/members`)
  },

  async setMemberRole(communityId, userId, role) {
    return httpClient.patch(`/communities/${communityId}/members/${userId}`, { role })
  },

  async removeMember(communityId, userId) {
    return httpClient.delete(`/communities/${communityId}/members/${userId}`)
  },

  async deleteCommunity(id) {
    return httpClient.delete(`/communities/${id}`)
  },
}
