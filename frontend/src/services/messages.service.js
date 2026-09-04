import { env } from '@/config/env'
import { httpClient } from '@/lib/http'
import { normalizeConversation, normalizeMessage } from '@/lib/normalize'

export const messagesService = {
  async listConversations() {
    if (env.useMocks) {
      const { mockMessaging } = await import('./mocks/mockApi')
      return mockMessaging.listConversations()
    }
    const conversations = await httpClient.get('/conversations')
    return conversations.map(normalizeConversation)
  },

  async getConversation(id) {
    if (env.useMocks) {
      const { mockMessaging } = await import('./mocks/mockApi')
      const conversations = await mockMessaging.listConversations()
      return conversations.find((c) => c.id === id) ?? null
    }
    const conversation = await httpClient.get(`/conversations/${id}`)
    return normalizeConversation(conversation)
  },

  async startConversation(participantIds) {
    if (env.useMocks) {
      const { mockMessaging } = await import('./mocks/mockApi')
      return mockMessaging.createConversation({ participantId: participantIds[0] })
    }
    const conversation = await httpClient.post('/conversations', { participant_ids: participantIds })
    return normalizeConversation(conversation)
  },

  async listMessages(conversationId) {
    if (env.useMocks) {
      const { mockMessaging } = await import('./mocks/mockApi')
      return mockMessaging.listMessages(conversationId)
    }
    const messages = await httpClient.get(`/conversations/${conversationId}/messages`)
    return messages.map(normalizeMessage)
  },

  async sendMessage(conversationId, content) {
    if (env.useMocks) {
      const { mockMessaging } = await import('./mocks/mockApi')
      return mockMessaging.sendMessage(conversationId, content)
    }
    const message = await httpClient.post(`/conversations/${conversationId}/messages`, { content })
    return normalizeMessage(message)
  },

  async markRead(messageId) {
    if (env.useMocks) {
      // Best-effort in mock mode — no read-receipt state to update.
      return { id: messageId, isRead: true }
    }
    const message = await httpClient.patch(`/messages/${messageId}/read`, {})
    return normalizeMessage(message)
  },
}
