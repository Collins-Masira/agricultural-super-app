import { env } from '@/config/env'
import { httpClient } from '@/lib/http'
import { toUserProfile } from '@/lib/normalize'
import { mockUsers } from './mocks/mockApi'

export const usersService = {
  async searchUsers(query, { page = 1, pageSize = 20 } = {}) {
    const term = query.trim()
    if (!term) return { items: [], page, pageSize }
    if (env.useMocks) return mockUsers.searchUsers(term, page, pageSize)
    const params = new URLSearchParams({ search: term, page, per_page: pageSize })
    const users = await httpClient.get(`/users?${params.toString()}`)
    return { items: users.map(toUserProfile), page, pageSize }
  },
}
