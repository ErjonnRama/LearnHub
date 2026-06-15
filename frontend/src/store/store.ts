import { create } from 'zustand'
import { authApi } from '../api/client'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  avatar_url?: string
  bio?: string
  created_at: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  initialized: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
  initialized: false,

  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data } = await authApi.login({ email, password })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      const me = await authApi.me()
      set({ user: me.data, isAuthenticated: true, loading: false, initialized: true })
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },

  register: async (formData) => {
    set({ loading: true })
    try {
      await authApi.register(formData)
      const { data } = await authApi.login({ email: formData.email, password: formData.password })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      const me = await authApi.me()
      set({ user: me.data, isAuthenticated: true, loading: false, initialized: true })
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false, initialized: true })
  },

  fetchMe: async () => {
    try {
      const { data } = await authApi.me()
      set({ user: data, isAuthenticated: true, initialized: true })
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ user: null, isAuthenticated: false, initialized: true })
    }
  },
}))

interface NotifState {
  notifications: any[]
  unreadCount: number
  addNotification: (n: any) => void
  setNotifications: (ns: any[]) => void
  markRead: (id: number) => void
}

export const useNotifStore = create<NotifState>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  setNotifications: (ns) =>
    set({ notifications: ns, unreadCount: ns.filter((n: any) => !n.is_read).length }),
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}))
