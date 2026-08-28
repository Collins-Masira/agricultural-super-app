import { httpClient } from '@/lib/http'
import { normalizeNotification } from '@/lib/normalize'

export const notificationsService = {
  async listNotifications(page = 1, pageSize = 20) {
    const notifications = await httpClient.get(`/notifications?page=${page}&per_page=${pageSize}`)
    return notifications.map(normalizeNotification)
  },

  async getUnreadCount() {
    const result = await httpClient.get('/notifications/unread-count')
    return result.count
  },

  async markRead(notificationId) {
    const notification = await httpClient.patch(`/notifications/${notificationId}/read`, {})
    return normalizeNotification(notification)
  },

  async markAllRead() {
    return httpClient.patch('/notifications/read-all', {})
  },
}
