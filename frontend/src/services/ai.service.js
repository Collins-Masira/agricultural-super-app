import { httpClient } from '@/lib/http'

/**
 * AI Farming Assistant. The backend proxies to the model provider server-
 * side (see backend/app/services/ai_service.py) -- no provider API key
 * ever reaches the browser.
 */
export const aiService = {
  /** `messages` is the full conversation so far: [{role, content}]. */
  async askAssistant(messages) {
    const result = await httpClient.post('/ai/assistant', { messages })
    return result.reply
  },
}
