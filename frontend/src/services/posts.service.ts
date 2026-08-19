import { env } from '@/config/env'
import { httpClient } from '@/lib/http'
import { Comment, Paginated, PostDetail } from '@/types/domain'
import { mockPosts } from './mocks/mockApi'

export const postsService = {
  async listPosts(page = 1, pageSize = 10): Promise<Paginated<PostDetail>> {
    if (env.useMocks) return mockPosts.listPosts(page, pageSize)
    return httpClient.get<Paginated<PostDetail>>(`/posts?page=${page}&pageSize=${pageSize}`)
  },

  async getPost(id: number): Promise<PostDetail> {
    if (env.useMocks) return mockPosts.getPost(id)
    return httpClient.get<PostDetail>(`/posts/${id}`)
  },

  async listUserPosts(userId: number): Promise<PostDetail[]> {
    if (env.useMocks) return mockPosts.listUserPosts(userId)
    return httpClient.get<PostDetail[]>(`/users/${userId}/posts`)
  },

  async createPost(input: { title: string; content: string; imageUrls: string[] }): Promise<PostDetail> {
    if (env.useMocks) return mockPosts.createPost(input)
    return httpClient.post<PostDetail>('/posts', input)
  },

  async toggleLike(postId: number): Promise<{ likedByMe: boolean; likeCount: number }> {
    if (env.useMocks) return mockPosts.toggleLike(postId)
    return httpClient.post<{ likedByMe: boolean; likeCount: number }>(`/posts/${postId}/like`, {})
  },

  async addComment(postId: number, content: string): Promise<Comment> {
    if (env.useMocks) return mockPosts.addComment(postId, content)
    return httpClient.post<Comment>(`/posts/${postId}/comments`, { content })
  },
}