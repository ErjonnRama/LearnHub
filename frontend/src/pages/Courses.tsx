import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { courseApi, categoryApi } from '../api/client'
import CourseCard from '../components/course/CourseCard'

const LEVELS = ['beginner', 'intermediate', 'advanced', 'all_levels']
const SORT_OPTIONS = [
  { value: 'num_subscribers', label: 'Most popular' },
  { value: 'avg_rating', label: 'Highest rated' },
  { value: 'price', label: 'Price' },
  { value: 'created_at', label: 'Newest' },
]

export default function Courses() {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [categoryId, setCategoryId] = useState(params.get('category_id') || '')
  const [level, setLevel] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState('')
  const [sortBy, setSortBy] = useState('num_subscribers')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await categoryApi.list()).data,
  })

  const queryParams: any = { page, page_size: 20, sort_by: sortBy, sort_order: 'desc' }
  if (q) queryParams.q = q
  if (categoryId) queryParams.category_id = parseInt(categoryId)
  if (level) queryParams.level = level
  if (minPrice) queryParams.min_price = parseFloat(minPrice)
  if (maxPrice) queryParams.max_price = parseFloat(maxPrice)
  if (minRating) queryParams.min_rating = parseFloat(minRating)

  const { data, isLoading } = useQuery({
    queryKey: ['courses', queryParams],
    queryFn: async () => (await courseApi.list(queryParams)).data,
    placeholderData: keepPreviousData,
  })

  const clearFilters = () => {
    setQ('')
    setCategoryId('')
    setLevel('')
    setMinPrice('')
    setMaxPrice('')
    setMinRating('')
    setPage(1)
  }

  const activeFiltersCount = [categoryId, level, minPrice, maxPrice, minRating].filter(Boolean).length

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-ink-400 font-medium mb-2">Catalog</p>
        <h1 className="heading-display font-bold text-4xl md:text-5xl tracking-tight">
          Find your next course
        </h1>
      </div>

      {/* Search bar */}
      <form onSubmit={(e) => { e.preventDefault(); setPage(1) }} className="flex gap-3 mb-6">
        <div className="flex-1 flex items-center gap-3 bg-surface border border-ink-200 rounded-full px-5 focus-within:border-ink-400 focus-within:shadow-soft transition-all">
          <Search className="w-4 h-4 text-ink-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by title, topic, or instructor..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            className="flex-1 py-3.5 text-sm bg-transparent placeholder-ink-400 outline-none"
          />
          {q && (
            <button type="button" onClick={() => { setQ(''); setPage(1) }} className="text-ink-400 hover:text-ink-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} relative`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-1 bg-coral-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </form>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-6 mb-6 animate-slide-down">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-xs font-medium text-ink-500 mb-1.5 block">Category</label>
              <select
                value={categoryId}
                onChange={(e) => { setCategoryId(e.target.value); setPage(1) }}
                className="input py-2"
              >
                <option value="">All</option>
                {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 mb-1.5 block">Level</label>
              <select
                value={level}
                onChange={(e) => { setLevel(e.target.value); setPage(1) }}
                className="input py-2 capitalize"
              >
                <option value="">All</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 mb-1.5 block">Min price</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1) }}
                placeholder="$0"
                className="input py-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 mb-1.5 block">Max price</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1) }}
                placeholder="$999"
                className="input py-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 mb-1.5 block">Min rating</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={minRating}
                onChange={(e) => { setMinRating(e.target.value); setPage(1) }}
                placeholder="0"
                className="input py-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 mb-1.5 block">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1) }}
                className="input py-2"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="mt-4 text-xs text-coral-600 hover:text-coral-700 font-medium">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      {data && (
        <p className="text-sm text-ink-500 mb-6">
          <strong className="text-ink-900">{data.total.toLocaleString()}</strong> courses
          {q && <> matching "<strong className="text-ink-900">{q}</strong>"</>}
        </p>
      )}

      {/* Grid */}
      {isLoading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-surface border border-ink-100 overflow-hidden">
              <div className="aspect-[4/3] shimmer" />
              <div className="p-5 space-y-3">
                <div className="h-5 shimmer rounded w-3/4" />
                <div className="h-3 shimmer rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="text-center py-24">
          <Search className="w-12 h-12 text-ink-200 mx-auto mb-4" />
          <p className="heading-display text-xl text-ink-700 font-semibold mb-1">Nothing found</p>
          <p className="text-sm text-ink-400 mb-6">Try different keywords or remove some filters</p>
          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="btn btn-outline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.items?.map((course: any) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-16">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-10 h-10 rounded-full border border-ink-200 hover:bg-ink-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-ink-600">
            Page <strong className="text-ink-900">{page}</strong> of <strong className="text-ink-900">{data.total_pages}</strong>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
            disabled={page === data.total_pages}
            className="w-10 h-10 rounded-full border border-ink-200 hover:bg-ink-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
