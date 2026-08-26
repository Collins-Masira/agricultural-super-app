import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { UNAUTHORIZED_EVENT } from '@/lib/http'
import {
  changePassword as changePasswordThunk,
  forgotPassword as forgotPasswordThunk,
  initializeSession,
  login as loginThunk,
  logout as logoutThunk,
  profileUpdated,
  register as registerThunk,
  resetPassword as resetPasswordThunk,
} from '@/store/slices/authSlice'

/**
 * Authentication layer built on the Redux `auth` slice.
 *
 * Keeps the same public API the pages rely on:
 *   useAuth() -> { status, user, login, register, logout, refreshProfile }
 */

/**
 * Initializes the session on app mount (restores the stored token).
 * Renders children immediately; the `status` flag drives route guards.
 */
export function AuthProvider({ children }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(initializeSession())
  }, [dispatch])

  useEffect(() => {
    function handleUnauthorized() {
      dispatch(logoutThunk())
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [dispatch])

  return children
}

export function useAuth() {
  const dispatch = useAppDispatch()
  const status = useAppSelector((state) => state.auth.status)
  const user = useAppSelector((state) => state.auth.user)

  const login = useCallback(
    (usernameOrEmail, password) =>
      dispatch(loginThunk({ usernameOrEmail, password })).unwrap(),
    [dispatch],
  )

  const register = useCallback(
    (input) => dispatch(registerThunk(input)).unwrap(),
    [dispatch],
  )

  const logout = useCallback(() => {
    dispatch(logoutThunk())
  }, [dispatch])

  const refreshProfile = useCallback(
    (profile) => dispatch(profileUpdated(profile)),
    [dispatch],
  )

  const forgotPassword = useCallback(
    (email) => dispatch(forgotPasswordThunk(email)).unwrap(),
    [dispatch],
  )

  const resetPassword = useCallback(
    (token, password) => dispatch(resetPasswordThunk({ token, password })).unwrap(),
    [dispatch],
  )

  const changePassword = useCallback(
    (currentPassword, newPassword) =>
      dispatch(changePasswordThunk({ currentPassword, newPassword })).unwrap(),
    [dispatch],
  )

  return {
    status,
    user,
    login,
    register,
    logout,
    refreshProfile,
    forgotPassword,
    resetPassword,
    changePassword,
  }
}

/** Normalize an unknown error into a human-readable message. */
export function errorMessage(error) {
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return error.message
  }
  return 'Something went wrong. Please try again.'
}