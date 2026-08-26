import { env } from '@/config/env'

const TOKEN_STORAGE_KEY = 'asa.access_token'

/**
 * Fired when the backend says the CURRENT SESSION's token itself is dead
 * (expired, forged, or the account was deactivated) -- identified by the
 * `code: "invalid_token"` marker on the error envelope (see
 * backend/app/errors.py's InvalidTokenError, raised only by
 * jwt_required). AuthContext listens for this to force a clean logout +
 * redirect to /login, rather than leaving the user stuck looking at an
 * inline error on whatever action they were performing.
 *
 * Deliberately NOT fired for every 401 -- a 401 can also mean an
 * ordinary domain-level failure on an otherwise-valid session (wrong
 * password at login, wrong current-password on change-password), which
 * the calling form already handles inline. Treating those the same as a
 * dead token used to silently wipe a perfectly valid session out from
 * under the user -- e.g. mistyping your current password on the change
 * password form would force-logout you, and any next action (like an
 * admin clicking Reactivate right after) would then fail with "Missing
 * or malformed Authorization header" for no visible reason.
 */
export const UNAUTHORIZED_EVENT = 'asa:unauthorized'

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
      // Backend error envelope is {"error": "...", "details": {...}} --
      // see backend/app/errors.py. Every failure mode (validation,
      // auth, not found, conflict, 500) uses this same shape.
      let error = { status: response.status, message: response.statusText }
      let code
      try {
        const body = await response.json()
        error = { status: response.status, message: body.error ?? response.statusText, details: body.details }
        code = body.code
      } catch {
        // Non-JSON error body; keep the status-based message.
      }

      if (response.status === 401 && token && code === 'invalid_token') {
        setAccessToken(null)
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
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

export const httpClient = new HttpClient(env.apiBaseUrl)