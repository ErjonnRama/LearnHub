import { useQuery } from '@tanstack/react-query'
import { adminApi, courseApi } from '../../api/client'
import { Users, BookOpen, GraduationCap, DollarSign, Wifi } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const CHART_COLORS = ['#7c3aed', '#f43f3a', '#10b981', '#f59e0b', '#06b6d4', '#a78bfa']

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await adminApi.stats()).data,
    refetchInterval: 10000,
  })

  const { data: topCourses } = useQuery({
    queryKey: ['top-courses'],
    queryFn: async () => (await courseApi.list({ page: 1, page_size: 8, sort_by: 'num_subscribers', sort_order: 'desc' })).data,
  })

  const { data: byCategory } = useQuery({
    queryKey: ['courses-by-cat'],
    queryFn: async () => (await courseApi.list({ page: 1, page_size: 100, sort_by: 'num_subscribers', sort_order: 'desc' })).data,
  })

  const statCards = [
    { icon: Users, label: 'Total users', value: stats?.total_users ?? '—', color: 'from-brand-500/20 to-brand-500/0' },
    { icon: BookOpen, label: 'Courses', value: stats?.total_courses ?? '—', color: 'from-coral-500/20 to-coral-500/0' },
    { icon: GraduationCap, label: 'Enrollments', value: stats?.total_enrollments ?? '—', color: 'from-emerald-500/20 to-emerald-500/0' },
    { icon: DollarSign, label: 'Revenue', value: stats ? `$${(stats.total_revenue || 0).toLocaleString()}` : '—', color: 'from-amber-500/20 to-amber-500/0' },
  ]

  const barData = topCourses?.items?.slice(0, 6).map((c: any) => ({
    name: c.title.length > 18 ? c.title.slice(0, 18) + '…' : c.title,
    students: c.num_subscribers,
  })) || []

  // Group by category for pie chart
  const catMap: Record<string, number> = {}
  byCategory?.items?.forEach((c: any) => {
    const name = c.category?.name || 'Other'
    catMap[name] = (catMap[name] || 0) + 1
  })
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value })).slice(0, 6)

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-400 font-medium mb-2">Overview</p>
          <h1 className="heading-display font-bold text-4xl text-white tracking-tight">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-night border border-night-700 rounded-full text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <Wifi className="w-3 h-3 text-stone-400" />
          <span className="text-stone-400"><strong className="text-white">{stats?.online_users ?? 0}</strong> online now</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={`relative bg-night border border-night-700 rounded-2xl p-5 overflow-hidden`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${color} pointer-events-none`} />
            <div className="relative">
              <Icon className="w-5 h-5 text-stone-400 mb-3" />
              <div className="heading-display font-bold text-3xl text-white tracking-tight">{value}</div>
              <div className="text-sm text-stone-400 mt-1">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-night border border-night-700 rounded-2xl p-6">
          <h2 className="heading-display font-semibold text-lg text-white mb-1">Top courses by enrollment</h2>
          <p className="text-xs text-stone-400 mb-5">Most popular courses on the platform</p>
          {barData.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -10, bottom: 30 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#a8a29e' }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c0a09', border: '1px solid #292524', borderRadius: 12, fontSize: 12 }}
                  cursor={{ fill: '#1c1917' }}
                />
                <Bar dataKey="students" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-night border border-night-700 rounded-2xl p-6">
          <h2 className="heading-display font-semibold text-lg text-white mb-1">By category</h2>
          <p className="text-xs text-stone-400 mb-5">Course distribution</p>
          {pieData.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c0a09', border: '1px solid #292524', borderRadius: 12, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-1.5 mt-4">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-stone-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {d.name}
                </span>
                <span className="text-stone-400">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-night border border-night-700 rounded-2xl p-6">
        <h2 className="heading-display font-semibold text-lg text-white mb-5">Top performing courses</h2>
        <div className="space-y-2">
          {topCourses?.items?.slice(0, 5).map((c: any, i: number) => (
            <div key={c.id} className="flex items-center gap-4 py-2 border-b border-night-700 last:border-0">
              <span className="heading-display text-2xl font-bold text-ink-600 w-8">{(i + 1).toString().padStart(2, '0')}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{c.title}</p>
                <p className="text-xs text-stone-400">{c.category?.name || 'Uncategorized'} · ⭐ {c.avg_rating.toFixed(1)}</p>
              </div>
              <span className="text-sm font-mono text-stone-400">{c.num_subscribers.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
