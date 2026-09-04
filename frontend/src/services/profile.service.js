import { env } from '@/config/env'
import { httpClient } from '@/lib/http'
import { toUserProfile } from '@/lib/normalize'
import { mockProfiles } from './mocks/mockApi'

function toProfileBody(input) {
  return {
    first_name: input.firstName ?? null,
    last_name: input.lastName ?? null,
    bio: input.bio ?? null,
    location: input.location ?? null,
    profile_image_url: input.profileImageUrl ?? null,
    phone_number: input.phoneNumber ?? null,
  }
}

export const profileService = {
  async getProfile(userId) {
    if (env.useMocks) return mockProfiles.getProfile(userId)
    const user = await httpClient.get(`/users/${userId}`)
    return toUserProfile(user)
  },

  async myProfile(userId) {
    if (env.useMocks) return mockProfiles.myProfile(userId)
    const user = await httpClient.get('/auth/me')
    return toUserProfile(user)
  },

  async updateProfile(userId, input) {
    if (env.useMocks) return mockProfiles.updateProfile(userId, input)
    // The backend always updates the caller's own profile (there's no
    // "update someone else's profile" concept) -- `userId` only matters
    // for the mock layer's in-memory lookup.
    await httpClient.put('/users/me/profile', toProfileBody(input))
    // Re-fetch the full user+profile in one shot, rather than hand-
    // assembling it client-side, so the result is guaranteed to match
    // what the server actually persisted.
    const user = await httpClient.get('/auth/me')
    return toUserProfile(user)
  },
}
