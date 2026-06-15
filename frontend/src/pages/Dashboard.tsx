import { useQuery } from '@tanstack/react-query'
import { enrollmentApi } from '../api/client'
import { useAuthStore } from '../store/store'
import { BookOpen, TrendingUp, Award, Clock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { data: enrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async () => (await enrollmentApi.myEnrollments()).data,
  })

  const active = enrollments?.filter((e: any) => e.status === 'active') || []
  const completed = enrollments?.filter((e: any) => e.status === 'completed') || []

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs uppercase tracking-widest text-ink-400 font-medium mb-2">Your space</p>
        <h1 className="heading-display font-bold text-4xl md:text-5xl tracking-tight">
          Welcome back,
          <em className="italic text-gradient-brand font-normal"> {user?.first_name}</em>
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { icon: BookOpen, label: 'Enrolled', value: enrollments?.length || 0 },
          { icon: TrendingUp, label: 'In progress', value: active.length },
          { icon: Award, label: 'Completed', value: completed.length },
          { icon: Clock, label: 'Hours learned', value: '0h' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-5">
            <Icon className="w-5 h-5 text-ink-400 mb-3" />
            <div className="heading-display font-bold text-3xl text-ink-900 tracking-tight">{value}</div>
            <div className="text-sm text-ink-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="heading-display font-bold text-2xl tracking-tight">My courses</h2>
        <Link to="/courses" className="text-sm text-ink-500 hover:text-ink-900 transition-colors flex items-center gap-1">
          Browse more <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!enrollments || enrollments.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-12 h-12 text-ink-200 mx-auto mb-4" />
          <p className="heading-display font-semibold text-lg text-ink-900 mb-1">Nothing here yet</p>
          <p className="text-sm text-ink-500 mb-6">Pick a course and start learning</p>
          <Link to="/courses" className="btn btn-primary">
            Browse courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((e: any) => (
            <Link
              key={e.id}
              to={`/courses/${e.course_id}`}
              className="card p-5 flex items-center gap-5 hover:shadow-lift transition-all group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-brand-200 to-coral-200 rounded-2xl flex items-center justify-center shrink-0 text-2xl">
                {e.course?.category?.icon || <BookOpen className="w-6 h-6 text-brand-700" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="heading-display font-semibold text-base text-ink-900 group-hover:text-brand-700 transition-colors truncate">
                  {e.course?.title || `Course #${e.course_id}`}
                </h3>
                {e.course?.category?.name && (
                  <p className="text-xs text-ink-400 mt-0.5">{e.course.category.name}</p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 bg-ink-100 rounded-full h-1.5 max-w-xs overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand-500 to-coral-500 h-full transition-all"
                      style={{ width: `${e.progress_percent || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-ink-500">{e.progress_percent?.toFixed(0) || 0}%</span>
                </div>
              </div>
              <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                e.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                e.status === 'active' ? 'bg-brand-50 text-brand-700' :
                'bg-ink-50 text-ink-500'
              }`}>
                {e.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
