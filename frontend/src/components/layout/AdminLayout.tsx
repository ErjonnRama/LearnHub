import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Users, Download, Settings, ArrowLeft, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/export', label: 'Data', icon: Download },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen flex bg-night font-sans">
      {/* Sidebar */}
      <aside className="w-60 bg-night border-r border-night-700 flex flex-col py-6 px-3 fixed inset-y-0">
        <Link to="/admin" className="flex items-center gap-2 px-3 mb-10">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-ink-900" />
          </div>
          <span className="heading-display font-bold text-white text-lg tracking-tight">
            Admin<span className="text-coral-400">.</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-white text-night shadow-soft'
                    : 'text-stone-400 hover:bg-night-700 hover:text-white',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <Link to="/" className="flex items-center gap-2 px-3 py-2 text-ink-500 hover:text-ink-300 text-xs transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to site
        </Link>
      </aside>

      {/* Content */}
      <main className="ml-60 flex-1 p-8 text-ink-50 animate-fade-in min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
