import { httpClient } from '@/lib/http'
import { normalizePost, toUserProfile } from '@/lib/normalize'

/**
 * Admin-only endpoints (backend enforces the role check on every one of
 * these -- see backend/app/auth/decorators.py's admin_required). This
 * service is only ever reached from admin-gated UI, but even if it
 * weren't, every call here would still 401/403 for a non-admin token.
 */
export const adminService = {
  async getStats() {
    const stats = await httpClient.get('/admin/stats')
    return {
      users: stats.users,
      posts: stats.posts,
      comments: stats.comments,
      communities: stats.communities,
      conversations: stats.conversations,
      messages: stats.messages,
      reports: stats.reports,
      ai: stats.ai,
      recentUsers: stats.recent_users.map(toUserProfile),
      recentPosts: stats.recent_posts.map(normalizePost),
    }
  },

  async listUsers({ search, role, status, page = 1, perPage = 20 } = {}) {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    if (search) params.set('search', search)
    if (role) params.set('role', role)
    if (status) params.set('status', status)

    const result = await httpClient.get(`/admin/users?${params.toString()}`)
    return {
      items: result.items.map(toUserProfile),
      page: result.page,
      perPage: result.per_page,
      total: result.total,
    }
  },

  async getUser(userId) {
    const user = await httpClient.get(`/admin/users/${userId}`)
    return toUserProfile(user)
  },

  async updateUser(userId, { isActive, role } = {}) {
    const body = {}
    if (isActive !== undefined) body.is_active = isActive
    if (role !== undefined) body.role = role
    const user = await httpClient.patch(`/admin/users/${userId}`, body)
    return toUserProfile(user)
  },

  async listReports({ status, page = 1, perPage = 20 } = {}) {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    if (status) params.set('status', status)

    const result = await httpClient.get(`/admin/reports?${params.toString()}`)
    return {
      items: result.items.map(normalizeReport),
      page: result.page,
      perPage: result.per_page,
      total: result.total,
    }
  },

  async reviewReport(reportId, status) {
    const report = await httpClient.patch(`/admin/reports/${reportId}`, { status })
    return normalizeReport(report)
  },
}

function normalizeReport(r) {
  return {
    id: r.id,
    postId: r.post_id,
    reason: r.reason,
    details: r.details,
    status: r.status,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
    reporter: toUserProfile(r.reporter),
    post: r.post ? { id: r.post.id, title: r.post.title, author: toUserProfile(r.post.author) } : null,
  }
}
