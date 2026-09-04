import { httpClient } from '@/lib/http'
import { normalizeStory } from '@/lib/normalize'

export const storiesService = {
  async listActiveStories() {
    const stories = await httpClient.get('/stories')
    return stories.map(normalizeStory)
  },

  async listUserStories(userId) {
    const stories = await httpClient.get(`/stories/users/${userId}`)
    return stories.map(normalizeStory)
  },

  async createStory({ imageUrl, caption }) {
    const story = await httpClient.post('/stories', {
      image_url: imageUrl,
      caption: caption || undefined,
    })
    return normalizeStory(story)
  },

  async deleteStory(storyId) {
    return httpClient.delete(`/stories/${storyId}`)
  },
}
