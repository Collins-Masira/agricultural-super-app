import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { setAccessToken, getAccessToken } from '@/lib/http'
import { authService } from '@/services'
import { ApiError, AuthSession, UserProfile } from '@/types/domain'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  user: UserProfile | null
  login: (usernameOrEmail: string, password: string) => Promise<void>
  register: (input: {
    username: string
    email: string
    password: string
    firstName?: string
    lastName?: string
  }) => Promise<void>
  logout: () => void
  refreshProfile: (profile: UserProfile) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function applySession(session: AuthSession): UserProfile {
  setAccessToken(session.accessToken)
  return session.user
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let cancelled = false

    async function restore() {
      if (!getAccessToken()) {
        if (!cancelled) setStatus('unauthenticated')
        return
      }
      try {
        const profile = await authService.me()
        if (!cancelled) {
          setUser(profile)
          setStatus('authenticated')
        }
      } catch (error) {
        if (!cancelled) {
          setAccessToken(null)
          setStatus('unauthenticated')
        }
      }
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const session = await authService.login(usernameOrEmail, password)
    setUser(applySession(session))
    setStatus('authenticated')
  }, [])

  const register = useCallback(
    async (input: {
      username: string
      email: string
      password: string
      firstName?: string
      lastName?: string
    }) => {
      const session = await authService.register(input)
      setUser(applySession(session))
      setStatus('authenticated')
    },
    [],
  )

  const logout = useCallback(() => {
    setAccessToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const refreshProfile = useCallback((profile: UserProfile) => {
    setUser(profile)
  }, [])

  const value = useMemo(
    () => ({ status, user, login, register, logout, refreshProfile }),
    [status, user, login, register, logout, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

/** Normalize an unknown error into a human-readable message. */
export function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as ApiError).message
  }
  return 'Something went wrong. Please try again.'
}