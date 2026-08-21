const TOKEN_STORAGE_KEY = 'asa.access_token'

export function getAccessToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setAccessToken(token) {
  if (token === null) {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  } else {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }
}

/**
 * Minimal typed fetch client for the backend API.
 * All responses are JSON; non-2xx responses are normalized into ApiError.
 */
class HttpClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
  }

  async request(path, init = {}) {
    const headers = new Headers(init.headers)
    headers.set('Content-Type', 'application/json')
    headers.set('Accept', 'application/json')

    const token = getAccessToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers })

    if (!response.ok) {
      let error = { status: response.status, message: response.statusText }
      try {
        const body = await response.json()
        error = { status: response.status, message: body.message ?? response.statusText, details: body.details }
      } catch {
        // Non-JSON error body; keep the status-based message.
      }
      throw error
    }

    if (response.status === 204) {
      return undefined
    }

    return await response.json()
  }

  get(path) {
    return this.request(path)
  }

  post(path, body) {
    return this.request(path, { method: 'POST', body: JSON.stringify(body) })
  }

  put(path, body) {
    return this.request(path, { method: 'PUT', body: JSON.stringify(body) })
  }

  patch(path, body) {
    return this.request(path, { method: 'PATCH', body: JSON.stringify(body) })
  }

  delete(path) {
    return this.request(path, { method: 'DELETE' })
  }
}

export const httpClient = new HttpClient('')