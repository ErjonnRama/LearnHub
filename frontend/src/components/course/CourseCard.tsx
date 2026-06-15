import { Link } from 'react-router-dom'
import { Star, Users, Clock } from 'lucide-react'
import { courseImage } from '../../utils/courseImage'

interface Props {
  course: {
    id: number
    title: string
    short_description?: string
    price: number
    level: string
    avg_rating: number
    num_subscribers: number
    duration_hours?: number
    thumbnail_url?: string
    language: string
    category?: { name: string; icon?: string }
    instructor?: { first_name: string; last_name: string }
  }
  variant?: 'default' | 'compact' | 'featured'
}

// Deterministic gradient based on course id
const gradients = [
  'from-brand-200 via-brand-100 to-coral-100',
  'from-coral-200 via-coral-100 to-amber-100',
  'from-emerald-200 via-emerald-100 to-cyan-100',
  'from-amber-200 via-amber-100 to-rose-100',
  'from-cyan-200 via-cyan-100 to-brand-100',
  'from-rose-200 via-rose-100 to-brand-100',
]

const levelBadge: Record<string, string> = {
  beginner: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  intermediate: 'bg-amber-50 text-amber-700 border-amber-100',
  advanced: 'bg-coral-50 text-coral-700 border-coral-100',
  all_levels: 'bg-brand-50 text-brand-700 border-brand-100',
}

export default function CourseCard({ course }: Props) {
  const gradient = gradients[course.id % gradients.length]

  return (
    <Link
      to={`/courses/${course.id}`}
      className="group block animate-slide-up"
    >
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-ink-100 hover:border-ink-200 hover:shadow-lift transition-all duration-300">
        {/* Thumbnail: real photo (deterministic per course), gradient behind as fallback */}
        <div className={`aspect-[4/3] bg-gradient-to-br ${gradient} relative overflow-hidden`}>
          <img
            src={course.thumbnail_url || courseImage(course.id, course.category?.name, course.title)}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          {/* Grain overlay */}
          <div className="absolute inset-0 bg-grain opacity-20 mix-blend-overlay" />

          {/* Category icon as decorative element */}
          {course.category?.icon && (
            <div className="absolute top-4 right-4 text-3xl opacity-80 group-hover:scale-110 transition-transform duration-300">
              {course.category.icon}
            </div>
          )}

          {course.category && (
            <span className="absolute top-4 left-4 bg-surface/90 backdrop-blur-sm text-xs font-medium text-ink-700 px-2.5 py-1 rounded-full border border-white/50">
              {course.category.name}
            </span>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-night/0 group-hover:bg-night/5 transition-colors" />
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="heading-display font-semibold text-ink-900 text-lg leading-tight line-clamp-2 group-hover:text-brand-700 transition-colors">
            {course.title}
          </h3>

          {course.instructor && (
            <p className="text-xs text-ink-400 mt-2">
              {course.instructor.first_name} {course.instructor.last_name}
            </p>
          )}

          {/* Rating row */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-ink-800">{course.avg_rating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-ink-400">·</span>
            <span className="text-xs text-ink-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {course.num_subscribers >= 1000 ? `${(course.num_subscribers / 1000).toFixed(0)}k` : course.num_subscribers}
            </span>
            {course.duration_hours && (
              <>
                <span className="text-xs text-ink-400">·</span>
                <span className="text-xs text-ink-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {course.duration_hours.toFixed(0)}h
                </span>
              </>
            )}
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink-50">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize ${levelBadge[course.level] || levelBadge.all_levels}`}>
              {course.level.replace('_', ' ')}
            </span>
            <span className="heading-display font-bold text-ink-900 text-base">
              {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
