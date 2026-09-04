import { env } from '@/config/env'
import { httpClient } from '@/lib/http'
import { normalizeComment, normalizePost } from '@/lib/normalize'
import { mockPosts } from './mocks/mockApi'

export const postsService = {
  async listPosts(page = 1, pageSize = 10) {
    if (env.useMocks) return mockPosts.listPosts(page, pageSize)
    const posts = await httpClient.get(`/posts?page=${page}&per_page=${pageSize}`)
    return { items: posts.map(normalizePost), page, pageSize }
  },

  async listReels(page = 1, pageSize = 10) {
    if (env.useMocks) {
      const all = await mockPosts.listPosts(1, 1000)
      const reels = all.items.filter((p) => p.videoUrl)
      const start = (page - 1) * pageSize
      return { items: reels.slice(start, start + pageSize), page, pageSize, total: reels.length }
    }
    const posts = await httpClient.get(`/posts?has_video=true&page=${page}&per_page=${pageSize}`)
    return { items: posts.map(normalizePost), page, pageSize }
  },

  async incrementView(postId) {
    if (env.useMocks) return { postId, views: 0 }
    return httpClient.post(`/posts/${postId}/view`, {})
  },

  async listCommunityPosts(communityId, page = 1, pageSize = 20) {
    if (env.useMocks) {
      const all = await mockPosts.listPosts(1, 1000)
      const items = all.items.filter((p) => p.communityId === communityId)
      const start = (page - 1) * pageSize
      return items.slice(start, start + pageSize)
    }
    const posts = await httpClient.get(`/communities/${communityId}/posts?page=${page}&per_page=${pageSize}`)
    return posts.map(normalizePost)
  },

  async listSavedPosts(page = 1, pageSize = 20) {
    if (env.useMocks) {
      const all = await mockPosts.listPosts(1, 1000)
      const items = all.items.filter((p) => p.savedByMe)
      const start = (page - 1) * pageSize
      return items.slice(start, start + pageSize)
    }
    const posts = await httpClient.get(`/posts/saved?page=${page}&per_page=${pageSize}`)
    return posts.map(normalizePost)
  },

  async getPost(id) {
    if (env.useMocks) return mockPosts.getPost(id)
    const post = await httpClient.get(`/posts/${id}`)
    return normalizePost(post)
  },

  async listUserPosts(userId) {
    if (env.useMocks) return mockPosts.listUserPosts(userId)
    const posts = await httpClient.get(`/users/${userId}/posts`)
    return posts.map(normalizePost)
  },

  async createPost(input) {
    if (env.useMocks) return mockPosts.createPost(input)
    const post = await httpClient.post('/posts', {
      title: input.title,
      content: input.content,
      images: (input.imageUrls ?? []).map((url) => ({ image_url: url })),
      community_id: input.communityId ?? undefined,
      is_announcement: input.isAnnouncement ?? undefined,
      video_url: input.videoUrl ?? undefined,
    })
    return normalizePost(post)
  },

  async likePost(postId) {
    if (env.useMocks) return mockPosts.toggleLike(postId)
    return httpClient.post(`/posts/${postId}/like`, {})
  },

  async unlikePost(postId) {
    if (env.useMocks) return mockPosts.toggleLike(postId)
    return httpClient.delete(`/posts/${postId}/like`)
  },

  async addComment(postId, content, parentCommentId) {
    if (env.useMocks) return mockPosts.addComment(postId, content)
    const comment = await httpClient.post(`/posts/${postId}/comments`, {
      content,
      parent_comment_id: parentCommentId ?? undefined,
    })
    return normalizeComment(comment)
  },

  async updatePost(postId, input) {
    if (env.useMocks) return mockPosts.updatePost?.(postId, input)
    const post = await httpClient.put(`/posts/${postId}`, {
      title: input.title,
      content: input.content,
    })
    return normalizePost(post)
  },

  async deletePost(postId) {
    if (env.useMocks) return
    return httpClient.delete(`/posts/${postId}`)
  },

  async setReaction(postId, reactionType) {
    if (env.useMocks) return { postId, reactionType, likedByMe: true }
    return httpClient.post(`/posts/${postId}/reactions`, { reaction_type: reactionType })
  },

  async removeReaction(postId) {
    if (env.useMocks) return { postId, likedByMe: false }
    return httpClient.delete(`/posts/${postId}/reactions`)
  },

  async savePost(postId) {
    if (env.useMocks) return { postId, savedByMe: true }
    return httpClient.post(`/posts/${postId}/save`, {})
  },

  async unsavePost(postId) {
    if (env.useMocks) return { postId, savedByMe: false }
    return httpClient.delete(`/posts/${postId}/save`)
  },

  async repostPost(postId, content) {
    if (env.useMocks) return { postId, repostedByMe: true, repostCount: 1 }
    const post = await httpClient.post(`/posts/${postId}/repost`, { content: content || undefined })
    return normalizePost(post)
  },

  async unrepostPost(postId) {
    if (env.useMocks) return { postId, repostedByMe: false, repostCount: 0 }
    return httpClient.delete(`/posts/${postId}/repost`)
  },

  async reportPost(postId, reason, details) {
    if (env.useMocks) return { postId, status: 'submitted' }
    return httpClient.post(`/posts/${postId}/report`, { reason, details: details || undefined })
  },
}
