import axios, { AxiosError } from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Refresh on 401
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as any
    if (!original || original._retry) return Promise.reject(error)

    if (error.response?.status === 401 && !original.url?.includes('/auth/')) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) {
        localStorage.clear()
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      isRefreshing = true
      try {
        const { data } = await axios.post('/api/v1/auth/refresh', { refresh_token: refresh })
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        refreshQueue.forEach((cb) => cb(data.access_token))
        refreshQueue = []
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch (err) {
        localStorage.clear()
        refreshQueue = []
        if (window.location.pathname !== '/login') window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)

export default api

// Auth
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateMe: (data: any) => api.put('/auth/me', data),
}

// Courses
export const courseApi = {
  list: (params: any) => api.get('/courses', { params }),
  get: (id: number) => api.get(`/courses/${id}`),
  popular: (limit = 8) => api.get('/courses/popular', { params: { limit } }),
  create: (data: any) => api.post('/courses', data),
  update: (id: number, data: any) => api.put(`/courses/${id}`, data),
  delete: (id: number) => api.delete(`/courses/${id}`),
}

export const categoryApi = {
  list: (q?: string) => api.get('/categories', { params: q ? { q } : {} }),
}

export const settingsApi = {
  public: () => api.get('/settings/public'),
}

export const enrollmentApi = {
  enroll: (courseId: number) => api.post(`/enrollments/${courseId}`),
  myEnrollments: () => api.get('/enrollments/my'),
}

export const reviewApi = {
  list: (courseId: number, params?: any) => api.get(`/reviews/${courseId}`, { params }),
  add: (courseId: number, data: any) => api.post(`/reviews/${courseId}`, data),
}

export const notifApi = {
  list: () => api.get('/notifications'),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
}

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: (page = 1, q?: string) => api.get('/admin/users', { params: { page, ...(q ? { q } : {}) } }),
  auditLogs: () => api.get('/admin/audit-logs'),
  settings: () => api.get('/admin/settings'),
}

export const exportApi = {
  export: (listName: string, format: string) =>
    api.get(`/export/${listName}`, { params: { format }, responseType: 'blob' }),
  importCourses: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/export/import/courses', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const paymentApi = {
  checkout: (courseId: number) => api.post('/payments/checkout', { course_id: courseId }),
}
