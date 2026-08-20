import { env } from '@/config/env'
import { httpClient } from '@/lib/http'
import { mockPosts } from './mocks/mockApi'

export const postsService = {
  async listPosts(page = 1, pageSize = 10) {
    if (env.useMocks) return mockPosts.listPosts(page, pageSize)
    return httpClient.get(`/posts?page=${page}&pageSize=${pageSize}`)
  },

  async getPost(id) {
    if (env.useMocks) return mockPosts.getPost(id)
    return httpClient.get(`/posts/${id}`)
  },

  async listUserPosts(userId) {
    if (env.useMocks) return mockPosts.listUserPosts(userId)
    return httpClient.get(`/users/${userId}/posts`)
  },

  async createPost(input) {
    if (env.useMocks) return mockPosts.createPost(input)
    return httpClient.post('/posts', input)
  },

  async toggleLike(postId) {
    if (env.useMocks) return mockPosts.toggleLike(postId)
    return httpClient.post(`/posts/${postId}/like`, {})
  },

  async addComment(postId, content) {
    if (env.useMocks) return mockPosts.addComment(postId, content)
    return httpClient.post(`/posts/${postId}/comments`, { content })
  },
}