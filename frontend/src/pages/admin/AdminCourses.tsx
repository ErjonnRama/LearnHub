import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { courseApi } from '../../api/client'
import { Search, Star, Users, ChevronLeft, ChevronRight } from 'lucide-react'

export default function AdminCourses() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', q, page],
    queryFn: async () => (await courseApi.list({
      page, page_size: 20, sort_by: 'num_subscribers', sort_order: 'desc',
      ...(q ? { q } : {}),
    })).data,
    placeholderData: keepPreviousData,
  })

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-400 font-medium mb-2">Catalog</p>
          <h1 className="heading-display font-bold text-4xl text-white tracking-tight">Courses</h1>
        </div>
        <span className="text-sm text-stone-400">
          <strong className="text-white">{data?.total?.toLocaleString() || 0}</strong> total
        </span>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-night border border-night-700 rounded-full px-5 mb-6 max-w-md focus-within:border-ink-700 transition-colors">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          placeholder="Search courses…"
          className="flex-1 py-3 text-sm bg-transparent text-white placeholder-stone-500 outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-night border border-night-700 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-night-700 text-left">
              <th className="px-6 py-4 text-xs uppercase tracking-wider text-stone-400 font-medium">Course</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider text-stone-400 font-medium">Category</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider text-stone-400 font-medium">Level</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider text-stone-400 font-medium">Rating</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider text-stone-400 font-medium">Students</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider text-stone-400 font-medium text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !data ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-night-700 last:border-0">
                  <td colSpan={6} className="px-6 py-4">
                    <div className="h-4 shimmer rounded w-3/4 bg-night-800" />
                  </td>
                </tr>
              ))
            ) : data?.items?.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-stone-400">No courses found</td></tr>
            ) : data?.items?.map((c: any) => (
              <tr key={c.id} className="border-b border-night-700 last:border-0 hover:bg-night-700/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-white max-w-md truncate">{c.title}</div>
                  <div className="text-xs text-stone-400 mt-0.5">#{c.id} · {c.language}</div>
                </td>
                <td className="px-6 py-4 text-stone-400 text-xs">
                  {c.category?.icon} {c.category?.name || '—'}
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-night-800 text-stone-400 capitalize">
                    {c.level.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-stone-400">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {c.avg_rating.toFixed(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-stone-400 font-mono text-xs">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {c.num_subscribers.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right heading-display font-bold text-white">
                  {c.price === 0 ? <span className="text-emerald-400 text-sm">Free</span> : `$${c.price.toFixed(2)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="w-9 h-9 rounded-full border border-night-700 hover:bg-night-700 disabled:opacity-30 transition-colors flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-stone-400">
            <strong className="text-white">{page}</strong> / {data.total_pages}
          </span>
          <button onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages}
            className="w-9 h-9 rounded-full border border-night-700 hover:bg-night-700 disabled:opacity-30 transition-colors flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
