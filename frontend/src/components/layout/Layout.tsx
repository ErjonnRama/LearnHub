import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Bell, Search, LogOut, Menu, X, ShieldCheck, Sparkles, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore, useNotifStore } from '../../store/store'
import { useTheme } from '../../hooks/useTheme'
import { notifApi } from '../../api/client'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { dark, toggle: toggleTheme } = useTheme()
  const { notifications, unreadCount, setNotifications, markRead } = useNotifStore()
  const [showNotifs, setShowNotifs] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await notifApi.list()
      setNotifications(data)
      return data
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  })

  const handleLogout = () => {
    logout()
    toast.success('See you soon')
    navigate('/')
  }

  const navLinks = [
    { to: '/courses', label: 'Courses' },
    ...(isAuthenticated ? [{ to: '/dashboard', label: 'My Learning' }, { to: '/chat', label: 'Community' }] : []),
  ]

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-ink-900">
      {/* NAVBAR */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-cream-50/80 backdrop-blur-lg border-b border-ink-100'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo — wordmark style */}
            <Link to="/" className="flex items-center gap-1.5 group">
              <div className="relative w-7 h-7 bg-night rounded-md flex items-center justify-center">
                <span className="text-white heading-display font-bold text-sm leading-none">L</span>
              </div>
              <span className="heading-display font-bold text-xl tracking-tight">
                Learnhub
                <span className="text-coral-500">.</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    pathname.startsWith(link.to)
                      ? 'text-ink-900 bg-ink-100'
                      : 'text-ink-500 hover:text-ink-900 hover:bg-ink-100/60'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <Link
                to="/courses"
                className="hidden md:flex items-center justify-center w-9 h-9 rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors"
              >
                <Search className="w-4 h-4" />
              </Link>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                className="w-9 h-9 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center"
              >
                {dark ? <Sun className="w-4 h-4 text-ink-600" /> : <Moon className="w-4 h-4 text-ink-600" />}
              </button>

              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifs(!showNotifs)}
                      className="relative w-9 h-9 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center"
                    >
                      <Bell className="w-4 h-4 text-ink-600" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 bg-coral-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center font-medium">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    {showNotifs && (
                      <div className="absolute right-0 mt-2 w-80 bg-surface rounded-2xl shadow-lift border border-ink-100 overflow-hidden z-50 animate-slide-down">
                        <div className="p-4 border-b border-ink-50">
                          <h3 className="heading-display font-semibold text-base">Notifications</h3>
                          <p className="text-xs text-ink-400 mt-0.5">{unreadCount} unread</p>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="py-8 text-center">
                              <p className="text-sm text-ink-400">All caught up</p>
                            </div>
                          ) : notifications.slice(0, 10).map((n: any) => (
                            <button
                              key={n.id}
                              onClick={() => { notifApi.markRead(n.id); markRead(n.id) }}
                              className={`w-full text-left px-4 py-3 hover:bg-ink-50 border-b border-ink-50 last:border-0 transition-colors ${!n.is_read ? 'bg-brand-50/40' : ''}`}
                            >
                              <p className="text-sm font-medium text-ink-800">{n.title || n.type}</p>
                              <p className="text-xs text-ink-400 mt-0.5 line-clamp-2">{n.message}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Avatar */}
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 hover:bg-ink-100 rounded-full pl-1 pr-3 py-1 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-coral-500 flex items-center justify-center text-white text-xs font-semibold">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                    <span className="hidden md:block text-sm font-medium text-ink-700">
                      {user?.first_name}
                    </span>
                  </Link>

                  <Link
                    to="/admin"
                    title="Admin"
                    className="hidden md:flex w-9 h-9 rounded-full text-ink-400 hover:bg-ink-100 hover:text-brand-600 transition-colors items-center justify-center"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Log out"
                    className="w-9 h-9 rounded-full text-ink-400 hover:bg-coral-50 hover:text-coral-500 transition-colors flex items-center justify-center"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-1.5 text-sm font-medium text-ink-700 hover:text-ink-900 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary"
                  >
                    Get started
                    <Sparkles className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Mobile menu */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden w-9 h-9 rounded-full hover:bg-ink-100 flex items-center justify-center"
              >
                {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-cream-50 border-t border-ink-100 animate-slide-down">
            <div className="p-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 rounded-lg">
                    Sign in
                  </Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 rounded-lg">
                    Get started →
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer */}
      <div className="h-16" />

      <main className="animate-fade-in">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="bg-night text-ink-300 mt-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-violet opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-1.5 mb-4">
                <div className="w-7 h-7 bg-cream-50 rounded-md flex items-center justify-center">
                  <span className="text-ink-900 heading-display font-bold text-sm leading-none">L</span>
                </div>
                <span className="heading-display font-bold text-2xl text-white tracking-tight">
                  Learnhub<span className="text-coral-400">.</span>
                </span>
              </div>
              <p className="text-sm text-ink-400 max-w-sm leading-relaxed">
                A learning platform powered by real Udemy course data. Built as a full-stack Lab Course 2 project.
              </p>
            </div>
            <div>
              <h4 className="heading-display font-semibold text-white mb-3 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/courses" className="hover:text-white transition-colors">Browse</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">My Learning</Link></li>
                <li><Link to="/chat" className="hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="heading-display font-semibold text-white mb-3 text-sm">Built with</h4>
              <ul className="space-y-2 text-xs font-mono text-ink-400">
                <li>FastAPI + PostgreSQL</li>
                <li>React + Vite + Tailwind</li>
                <li>Redis + MongoDB</li>
                <li>WebSocket realtime</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-night-700 mt-12 pt-6 flex flex-col md:flex-row justify-between gap-2 text-xs text-ink-500">
            <p>© {new Date().getFullYear()} Learnhub — Lab Course 2</p>
            <p>Made with care · v1.0</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
