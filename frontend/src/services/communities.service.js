import { env } from '@/config/env'
import { httpClient } from '@/lib/http'
import { normalizeCommunity } from '@/lib/normalize'

export const communitiesService = {
  async listCommunities(page = 1, pageSize = 20) {
    if (env.useMocks) {
      const { mockCommunities } = await import('./mocks/mockApi')
      return mockCommunities.listCommunities()
    }
    const communities = await httpClient.get(`/communities?page=${page}&per_page=${pageSize}`)
    return { items: communities.map(normalizeCommunity), page, pageSize }
  },

  async getCommunity(id) {
    if (env.useMocks) {
      const { mockCommunities } = await import('./mocks/mockApi')
      return mockCommunities.getCommunity(id)
    }
    const community = await httpClient.get(`/communities/${id}`)
    return normalizeCommunity(community)
  },

  async createCommunity({ name, description, imageUrl }) {
    if (env.useMocks) {
      const { mockCommunities } = await import('./mocks/mockApi')
      return mockCommunities.createCommunity({ name, description, imageUrl })
    }
    const community = await httpClient.post('/communities', {
      name,
      description: description || undefined,
      image_url: imageUrl || undefined,
    })
    return normalizeCommunity(community)
  },

  async joinCommunity(id) {
    if (env.useMocks) {
      const { mockCommunities } = await import('./mocks/mockApi')
      return mockCommunities.toggleMembership(id)
    }
    return httpClient.post(`/communities/${id}/members`, {})
  },

  async leaveCommunity(id) {
    if (env.useMocks) {
      const { mockCommunities } = await import('./mocks/mockApi')
      return mockCommunities.toggleMembership(id)
    }
    return httpClient.delete(`/communities/${id}/members`)
  },

  // Backend allows the community's creator OR an admin to delete it (see
  // community_service._assert_creator) -- moderation reuses this same
  // endpoint, there's no separate admin-only one.
  async deleteCommunity(id) {
    if (env.useMocks) return
    return httpClient.delete(`/communities/${id}`)
  },

  async followCommunity(id) {
    if (env.useMocks) {
      const { mockCommunities } = await import('./mocks/mockApi')
      return mockCommunities.toggleCommunityFollow(id)
    }
    return httpClient.post(`/communities/${id}/follow`)
  },

  async unfollowCommunity(id) {
    if (env.useMocks) {
      const { mockCommunities } = await import('./mocks/mockApi')
      return mockCommunities.toggleCommunityFollow(id)
    }
    return httpClient.delete(`/communities/${id}/follow`)
  },
}
