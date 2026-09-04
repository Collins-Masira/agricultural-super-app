import { env } from '@/config/env'
import { httpClient } from '@/lib/http'
import { normalizeNotification } from '@/lib/normalize'

export const notificationsService = {
  async listNotifications(page = 1, pageSize = 20) {
    if (env.useMocks) return []
    const notifications = await httpClient.get(`/notifications?page=${page}&per_page=${pageSize}`)
    return notifications.map(normalizeNotification)
  },

  async getUnreadCount() {
    if (env.useMocks) return 0
    const result = await httpClient.get('/notifications/unread-count')
    return result.count
  },

  async markRead(notificationId) {
    if (env.useMocks) return { id: notificationId, isRead: true }
    const notification = await httpClient.patch(`/notifications/${notificationId}/read`, {})
    return normalizeNotification(notification)
  },

  async markAllRead() {
    if (env.useMocks) return
    return httpClient.patch('/notifications/read-all', {})
  },
}
