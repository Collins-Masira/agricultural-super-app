import { httpClient } from '@/lib/http'
import { normalizeConversation, normalizeMessage } from '@/lib/normalize'

export const messagesService = {
  async listConversations() {
    const conversations = await httpClient.get('/conversations')
    return conversations.map(normalizeConversation)
  },

  async getConversation(id) {
    const conversation = await httpClient.get(`/conversations/${id}`)
    return normalizeConversation(conversation)
  },

  async startConversation(participantIds) {
    const conversation = await httpClient.post('/conversations', { participant_ids: participantIds })
    return normalizeConversation(conversation)
  },

  async listMessages(conversationId) {
    const messages = await httpClient.get(`/conversations/${conversationId}/messages`)
    return messages.map(normalizeMessage)
  },

  async sendMessage(conversationId, content) {
    const message = await httpClient.post(`/conversations/${conversationId}/messages`, { content })
    return normalizeMessage(message)
  },

  async markRead(messageId) {
    const message = await httpClient.patch(`/messages/${messageId}/read`, {})
    return normalizeMessage(message)
  },
}
