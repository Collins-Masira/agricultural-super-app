import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import postsReducer from './slices/postsSlice'
import expertsReducer from './slices/expertsSlice'
import profileReducer from './slices/profileSlice'

/**
 * Redux store for the Agricultural Super App frontend.
 *
 * Slices:
 * - auth     — session status + current user
 * - profile  — profile being viewed/edited
 * - posts    — feed, post detail, user posts, likes, comments
 * - experts  — expert discovery, expert profile, follows
 *
 * The slices call the existing service layer (src/services), which routes to
 * the mock API by default (VITE_USE_MOCKS=true) and to the real Flask API
 * once the backend contract is confirmed.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    posts: postsReducer,
    experts: expertsReducer,
  },
})

export default store