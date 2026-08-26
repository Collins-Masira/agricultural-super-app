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
    })
    return normalizePost(post)
  },

  // The backend has separate like/unlike endpoints, not a toggle -- the
  // caller (postsSlice) already knows the current liked state and picks
  // the right one. The mock layer only has a single toggle primitive, so
  // both call it; since the slice only calls likePost when not-yet-liked
  // and unlikePost when already-liked, either path flips the mock's
  // state to the intended value exactly once.
  async likePost(postId) {
    if (env.useMocks) return mockPosts.toggleLike(postId)
    return httpClient.post(`/posts/${postId}/like`, {})
  },

  async unlikePost(postId) {
    if (env.useMocks) return mockPosts.toggleLike(postId)
    return httpClient.delete(`/posts/${postId}/like`)
  },

  async addComment(postId, content) {
    if (env.useMocks) return mockPosts.addComment(postId, content)
    const comment = await httpClient.post(`/posts/${postId}/comments`, { content })
    return normalizeComment(comment)
  },

  // Backend allows the post's owner OR an admin to delete it (see
  // post_service._assert_owner) -- there's no separate admin-only
  // delete endpoint, this just calls the same one moderation reuses.
  async deletePost(postId) {
    if (env.useMocks) return
    return httpClient.delete(`/posts/${postId}`)
  },
}
