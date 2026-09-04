/**
 * Runtime configuration read from environment variables.
 * See .env.example for documented variables.
 */

function readBool(value, fallback) {
  if (value === undefined) return fallback
  return value.toLowerCase() === 'true' || value === '1'
}

export const env = {
  /** Base URL of the backend API (used only when mocks are disabled). */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',

  /**
   * When true, the service layer uses the isolated in-repo mock data instead
   * of real HTTP calls. Defaults to false so a production build talks to the
   * real backend out of the box. Flip on (VITE_USE_MOCKS=true) for frontend
   * development without a running API.
   */
  useMocks: readBool(import.meta.env.VITE_USE_MOCKS, false),
}