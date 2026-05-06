import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { findUser, EntityUser } from '../data/entityConfig'

interface AuthState {
  isAuthenticated: boolean
  user: EntityUser | null
  error: string | null
}

const authSlice = createSlice({
  name: 'auth',
  initialState: { isAuthenticated: false, user: null, error: null } as AuthState,
  reducers: {
    login(state, action: PayloadAction<{ email: string; password: string }>) {
      const found = findUser(action.payload.email, action.payload.password)
      if (found) {
        state.isAuthenticated = true
        state.user = found
        state.error = null
      } else {
        state.error = 'Invalid credentials. Check the login hints below.'
      }
    },
    logout(state) {
      state.isAuthenticated = false
      state.user = null
      state.error = null
    },
    clearError(state) { state.error = null },
  },
})

export const { login, logout, clearError } = authSlice.actions
export const store = configureStore({ reducer: { auth: authSlice.reducer } })
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
