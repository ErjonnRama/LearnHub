import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ArrowRight, Sparkles, ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { courseApi, categoryApi, settingsApi } from '../api/client'
import CourseCard from '../components/course/CourseCard'

export default function Home() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: popular } = useQuery({
    queryKey: ['popular-courses'],
    queryFn: async () => (await courseApi.popular(8)).data,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await categoryApi.list()).data,
  })

  // CMS-managed site content (editable from Admin → Settings)
  const { data: cms } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => (await settingsApi.public()).data,
    staleTime: 60_000,
  })

  // Split CMS hero title so the middle word gets the italic gradient treatment
  const heroTitle: string = cms?.hero_title || 'Where Curiosity Becomes Career'
  const heroWords = heroTitle.replace(/\.$/, '').split(' ')
  const accentIdx = heroWords.length > 2 ? 1 : 0

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) navigate(`/courses?q=${encodeURIComponent(search)}`)
    else navigate('/courses')
  }

  return (
    <div>
      {/* HERO — editorial, asymmetric */}
      <section className="relative overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-mesh-violet opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-grain opacity-30 mix-blend-overlay pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-8 animate-fade-in">
            <div className="flex items-center gap-1.5 bg-night text-white rounded-full pl-1 pr-3 py-1 text-xs font-medium">
              <span className="w-5 h-5 rounded-full bg-coral-500 flex items-center justify-center">
                <Sparkles className="w-3 h-3" />
              </span>
              New
            </div>
            <span className="text-xs text-ink-500 font-medium">
              Powered by real Udemy course data — 5,000+ courses
            </span>
          </div>

          {/* Headline — massive editorial */}
          <h1 className="heading-display font-bold text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight max-w-5xl animate-slide-up">
            {heroWords.map((w, i) => (
              i === accentIdx
                ? <em key={i} className="text-gradient-brand italic font-normal mx-2 lowercase">{w.toLowerCase()}</em>
                : <span key={i}>{i > 0 ? ' ' : ''}{w}{i < heroWords.length - 1 ? ' ' : ''}</span>
            ))}
            <span className="text-coral-500">.</span>
          </h1>

          <p className="mt-8 text-lg md:text-xl text-ink-600 max-w-2xl leading-relaxed font-light animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {cms?.hero_subtitle || 'Real courses, real outcomes. Join a million learners building the skills that change everything.'}
          </p>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="mt-12 flex flex-col sm:flex-row gap-3 max-w-xl animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex-1 flex items-center gap-3 bg-surface border border-ink-200 rounded-full px-5 shadow-soft focus-within:border-ink-400 focus-within:shadow-lift transition-all">
              <Search className="w-4 h-4 text-ink-400 shrink-0" />
              <input
                type="text"
                placeholder="What do you want to learn?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 py-4 text-sm bg-transparent placeholder-ink-400 outline-none"
              />
            </div>
            <button type="submit" className="btn btn-primary px-6 py-4">
              Search <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Trust signals as decorative numbers */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {[
              ['5,000+', 'Courses', 'across 8 categories'],
              ['1M+', 'Learners', 'on the platform'],
              ['4.6', 'Avg rating', 'across all courses'],
              ['250k+', 'Certificates', 'issued globally'],
            ].map(([num, label, sub]) => (
              <div key={label}>
                <div className="heading-display font-bold text-4xl md:text-5xl text-ink-900 tracking-tight">{num}</div>
                <div className="text-sm font-medium text-ink-800 mt-1">{label}</div>
                <div className="text-xs text-ink-400">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES — pill grid */}
      {categories && categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 border-t border-ink-100">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-400 font-medium mb-2">Explore</p>
              <h2 className="heading-display font-bold text-3xl md:text-4xl tracking-tight">
                Pick a path
              </h2>
            </div>
            <button
              onClick={() => navigate('/courses')}
              className="hidden md:flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900 transition-colors font-medium"
            >
              See all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.slice(0, 8).map((cat: any, i: number) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/courses?category_id=${cat.id}`)}
                className="group relative overflow-hidden p-6 bg-surface border border-ink-100 rounded-2xl text-left hover:border-ink-300 hover:-translate-y-1 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="text-3xl mb-3">{cat.icon || '📚'}</div>
                <div className="heading-display font-semibold text-base text-ink-900 group-hover:text-brand-700 transition-colors">
                  {cat.name}
                </div>
                {cat.description && (
                  <div className="text-xs text-ink-400 mt-1 line-clamp-1">{cat.description}</div>
                )}
                <ArrowUpRight className="w-4 h-4 text-ink-300 absolute top-6 right-6 group-hover:text-brand-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* POPULAR COURSES */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-400 font-medium mb-2">Most loved</p>
            <h2 className="heading-display font-bold text-3xl md:text-4xl tracking-tight">
              Trending right now
            </h2>
          </div>
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900 transition-colors font-medium"
          >
            All courses <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {popular && popular.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {popular.map((course: any) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-surface border border-ink-100 overflow-hidden">
                <div className="aspect-[4/3] shimmer" />
                <div className="p-5 space-y-3">
                  <div className="h-5 shimmer rounded w-3/4" />
                  <div className="h-3 shimmer rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-night p-12 md:p-16 text-white">
          <div className="absolute inset-0 bg-mesh-violet opacity-30 pointer-events-none" />
          <div className="absolute inset-0 bg-grain opacity-30 mix-blend-overlay pointer-events-none" />
          <div className="relative max-w-2xl">
            <p className="text-xs uppercase tracking-widest text-coral-400 font-medium mb-4">Start today</p>
            <h2 className="heading-display font-bold text-4xl md:text-5xl tracking-tight leading-tight mb-4">
              Your next chapter starts with one lesson.
            </h2>
            <p className="text-ink-300 text-lg mb-8 max-w-xl">
              Create a free account and start learning in under 30 seconds.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="btn bg-cream-50 text-ink-900 hover:bg-surface px-7 py-3.5"
            >
              Create free account <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
