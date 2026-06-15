import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Users, Clock, Globe, Award, CheckCircle, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { courseApi, enrollmentApi, reviewApi, paymentApi } from '../api/client'
import { useAuthStore } from '../store/store'
import toast from 'react-hot-toast'
import { courseImage } from '../utils/courseImage'

const gradients = [
  'from-brand-300 via-brand-200 to-coral-200',
  'from-coral-300 via-coral-200 to-amber-200',
  'from-emerald-300 via-emerald-200 to-cyan-200',
  'from-amber-300 via-amber-200 to-rose-200',
  'from-cyan-300 via-cyan-200 to-brand-200',
  'from-rose-300 via-rose-200 to-brand-200',
]

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [reviewText, setReviewText] = useState('')
  const [rating, setRating] = useState(5)

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => (await courseApi.get(Number(id))).data,
  })

  const [reviewSearch, setReviewSearch] = useState('')
  const { data: reviews } = useQuery({
    queryKey: ['reviews', id, reviewSearch],
    queryFn: async () => (await reviewApi.list(Number(id), reviewSearch ? { q: reviewSearch } : undefined)).data,
  })

  const enrollMut = useMutation({
    mutationFn: () => enrollmentApi.enroll(Number(id)),
    onSuccess: () => {
      toast.success('Enrolled! Welcome aboard')
      qc.invalidateQueries({ queryKey: ['my-enrollments'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Could not enroll'),
  })

  const payMut = useMutation({
    mutationFn: () => paymentApi.checkout(Number(id)),
    onSuccess: () => {
      toast.success('Payment successful — you\'re in')
      qc.invalidateQueries({ queryKey: ['my-enrollments'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Payment failed'),
  })

  const reviewMut = useMutation({
    mutationFn: () => reviewApi.add(Number(id), { rating, comment: reviewText }),
    onSuccess: () => {
      toast.success('Review submitted')
      setReviewText('')
      qc.invalidateQueries({ queryKey: ['reviews', id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Could not submit'),
  })

  if (isLoading || !course) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="h-10 shimmer rounded w-2/3 mb-4" />
        <div className="h-64 shimmer rounded-2xl mb-6" />
      </div>
    )
  }

  const gradient = gradients[course.id % gradients.length]

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main */}
        <div className="lg:col-span-2">
          {/* Category */}
          {course.category && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-ink-500 uppercase tracking-widest">
                {course.category.icon} {course.category.name}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="heading-display font-bold text-4xl md:text-5xl tracking-tight leading-[1.05] mb-6">
            {course.title}
          </h1>

          {course.short_description && (
            <p className="text-lg text-ink-600 leading-relaxed font-light mb-6">
              {course.short_description}
            </p>
          )}

          {/* Stats inline */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-500 mb-8 pb-8 border-b border-ink-100">
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <strong className="text-ink-900 font-semibold">{course.avg_rating.toFixed(1)}</strong>
              <span className="text-ink-400">({course.num_reviews.toLocaleString()} reviews)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-ink-400" />
              {course.num_subscribers.toLocaleString()} students
            </span>
            {course.duration_hours && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-ink-400" />
                {course.duration_hours.toFixed(1)}h
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-ink-400" />
              {course.language}
            </span>
          </div>

          {/* Instructor */}
          {course.instructor && (
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-coral-400 flex items-center justify-center text-white text-sm font-semibold">
                {course.instructor.first_name[0]}{course.instructor.last_name[0]}
              </div>
              <div>
                <p className="text-xs text-ink-400">Instructor</p>
                <p className="text-sm font-semibold text-ink-900">{course.instructor.first_name} {course.instructor.last_name}</p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="prose prose-sm max-w-none mb-12">
            <h2 className="heading-display font-bold text-2xl mb-4">About this course</h2>
            <div className="text-ink-600 leading-relaxed whitespace-pre-line">
              {course.description}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <h2 className="heading-display font-bold text-2xl">
                Reviews <span className="text-ink-400 font-normal">({reviews?.length || 0})</span>
              </h2>
              <input
                type="text"
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                placeholder="Search reviews…"
                className="input !w-56 !py-2 !rounded-full"
              />
            </div>

            {isAuthenticated && (
              <div className="card p-5 mb-6">
                <p className="text-sm font-medium text-ink-800 mb-3">Share your experience</p>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-110">
                      <Star className={`w-5 h-5 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-ink-200'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="What did you think?"
                  rows={3}
                  className="input resize-none"
                />
                <button
                  onClick={() => reviewMut.mutate()}
                  disabled={reviewMut.isPending}
                  className="btn btn-primary mt-3"
                >
                  {reviewMut.isPending ? 'Submitting…' : 'Submit review'}
                </button>
              </div>
            )}

            <div className="space-y-4">
              {reviews?.slice(0, 10).map((r: any) => (
                <div key={r.id} className="border-b border-ink-100 pb-5 last:border-0">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-coral-400 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                      {r.student?.first_name?.[0]}{r.student?.last_name?.[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink-900">
                          {r.student?.first_name} {r.student?.last_name}
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-ink-200'}`} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-ink-600 mt-1 leading-relaxed">{r.comment}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card overflow-hidden sticky top-24">
            {/* Visual */}
            <div className={`aspect-video bg-gradient-to-br ${gradient} relative overflow-hidden`}>
              <img
                src={course.thumbnail_url || courseImage(course.id, course.category?.name, course.title, '640/360')}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div className="absolute inset-0 bg-grain opacity-20 mix-blend-overlay" />
              {course.category?.icon && (
                <div className="absolute inset-0 flex items-center justify-center text-6xl">
                  {course.category.icon}
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="heading-display font-bold text-3xl text-ink-900 mb-5">
                {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
              </div>

              {isAuthenticated ? (
                course.price === 0 ? (
                  <button
                    onClick={() => enrollMut.mutate()}
                    disabled={enrollMut.isPending}
                    className="w-full btn btn-primary py-3.5 text-base"
                  >
                    {enrollMut.isPending ? 'Enrolling…' : 'Enroll for free'}
                  </button>
                ) : (
                  <button
                    onClick={() => payMut.mutate()}
                    disabled={payMut.isPending}
                    className="w-full btn btn-coral py-3.5 text-base"
                  >
                    {payMut.isPending ? 'Processing…' : `Buy now — $${course.price.toFixed(2)}`}
                  </button>
                )
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full btn btn-primary py-3.5 text-base"
                >
                  Sign in to enroll
                </button>
              )}

              <ul className="mt-6 space-y-3 text-sm text-ink-600">
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Full lifetime access
                </li>
                <li className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-emerald-500" />
                  Certificate of completion
                </li>
                <li className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  Language: {course.language}
                </li>
                {course.duration_hours && (
                  <li className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    {course.duration_hours.toFixed(1)} hours of content
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
