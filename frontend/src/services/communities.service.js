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

  async joinCommunity(id) {
    return httpClient.post(`/communities/${id}/members`, {})
  },

  async leaveCommunity(id) {
    return httpClient.delete(`/communities/${id}/members`)
  },

  // Backend allows the community's creator OR an admin to delete it (see
  // community_service._assert_creator) -- moderation reuses this same
  // endpoint, there's no separate admin-only one.
  async deleteCommunity(id) {
    return httpClient.delete(`/communities/${id}`)
  },
}
