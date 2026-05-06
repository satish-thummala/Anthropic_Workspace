import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  name: string
  email: string
  role: string
  avatar: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  error: string | null
}

const DEMO_USER = {
  name: 'Alex Morgan',
  email: 'alex@enterprise.io',
  role: 'Admin',
  avatar: 'AM',
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: false,
    user: null,
    error: null,
  } as AuthState,
  reducers: {
    login(state, action: PayloadAction<{ email: string; password: string }>) {
      const { email, password } = action.payload
      if (
        (email === 'admin@enterprise.io' || email === 'demo@demo.com') &&
        password === 'password123'
      ) {
        state.isAuthenticated = true
        state.user = { ...DEMO_USER, email }
        state.error = null
      } else {
        state.error = 'Invalid credentials. Use admin@enterprise.io / password123'
      }
    },
    logout(state) {
      state.isAuthenticated = false
      state.user = null
      state.error = null
    },
    clearError(state) {
      state.error = null
    },
  },
})

export const { login, logout, clearError } = authSlice.actions

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
