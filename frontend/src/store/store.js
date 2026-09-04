import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import postsReducer from './slices/postsSlice'
import expertsReducer from './slices/expertsSlice'
import profileReducer from './slices/profileSlice'
import communitiesReducer from './slices/communitiesSlice'
import messagesReducer from './slices/messagesSlice'
import adminReducer from './slices/adminSlice'
import aiReducer from './slices/aiSlice'

/**
 * Redux store for the Agricultural Super App frontend.
 *
 * Slices:
 * - auth        — session status + current user
 * - profile     — profile being viewed/edited
 * - posts       — feed, post detail, user posts, likes, comments
 * - experts     — expert discovery, expert profile, follows
 * - communities — community discovery, membership
 * - messages    — conversations and messages
 *
 * The slices call the service layer (src/services), which routes to the
 * in-repo mock data layer when VITE_USE_MOCKS=true, and to the real Flask
 * API otherwise (see src/config/env.js).
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    posts: postsReducer,
    experts: expertsReducer,
    communities: communitiesReducer,
    messages: messagesReducer,
    admin: adminReducer,
    ai: aiReducer,
  },
})

export default store
