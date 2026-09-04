import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { authService } from '@/services'
import { getAccessToken, setAccessToken } from '@/lib/http'

const initialState = {
  /** 'loading' | 'authenticated' | 'unauthenticated' */
  status: 'loading',
  user: null,
}

function applySession(session) {
  setAccessToken(session.accessToken)
  return session.user
}

export const initializeSession = createAsyncThunk('auth/initializeSession', async () => {
  if (!getAccessToken()) return null
  return authService.me()
})

export const login = createAsyncThunk(
  'auth/login',
  async ({ usernameOrEmail, password }, { rejectWithValue }) => {
    try {
      const session = await authService.login(usernameOrEmail, password)
      return applySession(session)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Login failed.')
    }
  },
)

export const register = createAsyncThunk(
  'auth/register',
  async (input, { rejectWithValue }) => {
    try {
      const session = await authService.register(input)
      return applySession(session)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Registration failed.')
    }
  },
)

export const logout = createAsyncThunk('auth/logout', async () => {
  setAccessToken(null)
  return null
})

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      return await authService.forgotPassword(email)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Could not request a password reset.')
    }
  },
)

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      return await authService.resetPassword(token, password)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Could not reset your password.')
    }
  },
)

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      return await authService.changePassword(currentPassword, newPassword)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Could not change your password.')
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    profileUpdated(state, action) {
      state.user = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeSession.fulfilled, (state, action) => {
        state.user = action.payload ?? null
        state.status = action.payload ? 'authenticated' : 'unauthenticated'
      })
      .addCase(initializeSession.rejected, (state) => {
        setAccessToken(null)
        state.user = null
        state.status = 'unauthenticated'
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = 'authenticated'
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = 'authenticated'
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.status = 'unauthenticated'
      })
  },
})

export const { profileUpdated } = authSlice.actions
export default authSlice.reducer