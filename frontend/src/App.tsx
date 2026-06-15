import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/store'
import { useNotificationSocket } from './hooks/useWebSocket'
import Layout from './components/layout/Layout'
import AdminLayout from './components/layout/AdminLayout'
import LoadingSpinner from './components/ui/LoadingSpinner'

const Home = lazy(() => import('./pages/Home'))
const Courses = lazy(() => import('./pages/Courses'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const Chat = lazy(() => import('./pages/Chat'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminCourses = lazy(() => import('./pages/admin/AdminCourses'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminExport = lazy(() => import('./pages/admin/AdminExport'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false } },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initialized } = useAuthStore()
  if (!initialized && localStorage.getItem('access_token')) {
    return <LoadingSpinner fullPage />
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function NotificationConnector() {
  const { user } = useAuthStore()
  useNotificationSocket(user?.id)
  return null
}

export default function App() {
  const { fetchMe } = useAuthStore()

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      fetchMe()
    } else {
      useAuthStore.setState({ initialized: true })
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NotificationConnector />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1c1917',
              color: '#fafaf9',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontFamily: 'DM Sans, system-ui, sans-serif',
            },
            success: { iconTheme: { primary: '#7c3aed', secondary: '#fafaf9' } },
            error: { iconTheme: { primary: '#f43f3a', secondary: '#fafaf9' } },
          }}
        />
        <Suspense fallback={<LoadingSpinner fullPage />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/chat/:roomId?" element={<Chat />} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="export" element={<AdminExport />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
