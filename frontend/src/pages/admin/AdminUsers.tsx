import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminUsers() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', page, q],
    queryFn: async () => (await adminApi.users(page, q || undefined)).data,
    placeholderData: keepPreviousData,
  })

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-400 font-medium mb-2">People</p>
          <h1 className="heading-display font-bold text-4xl text-white tracking-tight">Users</h1>
        </div>
        <span className="text-sm text-stone-400">
          <strong className="text-white">{users?.length || 0}</strong> shown
        </span>
      </div>

      <div className="flex items-center gap-3 bg-night border border-night-700 rounded-full px-5 mb-6 max-w-md focus-within:border-ink-700 transition-colors">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          placeholder="Search by name or email…"
          className="flex-1 py-3 text-sm bg-transparent text-white placeholder-stone-500 outline-none"
        />
      </div>

      <div className="bg-night border border-night-700 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-night-700 text-left">
              <th className="px-6 py-4 text-xs uppercase tracking-wider text-stone-400 font-medium">User</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider text-stone-400 font-medium">Email</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider text-stone-400 font-medium">Status</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider text-stone-400 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !users ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-night-700 last:border-0">
                  <td colSpan={4} className="px-6 py-4">
                    <div className="h-4 shimmer rounded w-3/4 bg-night-800" />
                  </td>
                </tr>
              ))
            ) : users?.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-stone-400">No users</td></tr>
            ) : users?.map((u: any) => (
              <tr key={u.id} className="border-b border-night-700 last:border-0 hover:bg-night-700/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-coral-500 flex items-center justify-center text-white text-xs font-semibold">
                      {u.first_name?.[0]}{u.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-white">{u.first_name} {u.last_name}</p>
                      <p className="text-xs text-stone-400">#{u.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-stone-400 text-xs font-mono">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    u.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-night-800 text-stone-500 border border-ink-700'
                  }`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-stone-400 text-xs">
                  {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-3 mt-6">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          className="w-9 h-9 rounded-full border border-night-700 hover:bg-night-700 disabled:opacity-30 transition-colors flex items-center justify-center">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-stone-400">Page <strong className="text-white">{page}</strong></span>
        <button onClick={() => setPage((p) => p + 1)} disabled={!users || users.length < 20}
          className="w-9 h-9 rounded-full border border-night-700 hover:bg-night-700 disabled:opacity-30 transition-colors flex items-center justify-center">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
