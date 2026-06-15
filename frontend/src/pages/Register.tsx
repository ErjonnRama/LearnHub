import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/store'
import { ArrowRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '' })
  const { register, loading } = useAuthStore()
  const navigate = useNavigate()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register(form)
      toast.success('Welcome to Learnhub')
      navigate('/dashboard')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      const msg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail[0]?.msg || 'Registration failed'
          : 'Registration failed'
      toast.error(msg)
    }
  }

  const passwordValid = form.password.length >= 8

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2 -mt-16 pt-16">
      {/* Left — editorial */}
      <div className="hidden lg:flex relative items-center justify-center bg-night text-white p-12 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-violet opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-grain opacity-30 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10 max-w-md">
          <p className="text-xs uppercase tracking-widest text-coral-400 font-medium mb-6">Join 1M+ learners</p>
          <h2 className="heading-display text-4xl font-bold leading-tight tracking-tight">
            Start where you are.
            <br />
            <em className="italic text-brand-300 font-normal">Build what's next.</em>
          </h2>
          <ul className="mt-10 space-y-4">
            {[
              'Free account — no credit card needed',
              '5,000+ courses across 8 categories',
              'Certificates of completion',
              'Real-time community chat',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-ink-300">
                <span className="w-5 h-5 rounded-full bg-brand-500/30 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-brand-200" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-slide-up">
          <h1 className="heading-display font-bold text-4xl tracking-tight mb-2">
            Create your account<span className="text-coral-500">.</span>
          </h1>
          <p className="text-ink-500 mb-8 text-sm">
            Already have one? <Link to="/login" className="text-brand-700 hover:text-brand-800 font-medium underline-offset-4 hover:underline">Sign in</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-ink-500 mb-1.5 block uppercase tracking-wider">First name</label>
                <input value={form.first_name} onChange={set('first_name')} required className="input" placeholder="Jane" autoComplete="given-name" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-500 mb-1.5 block uppercase tracking-wider">Last name</label>
                <input value={form.last_name} onChange={set('last_name')} required className="input" placeholder="Doe" autoComplete="family-name" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 mb-1.5 block uppercase tracking-wider">Email</label>
              <input type="email" value={form.email} onChange={set('email')} required className="input" placeholder="you@example.com" autoComplete="email" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 mb-1.5 block uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                required
                minLength={8}
                className="input"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
              {form.password && (
                <p className={`mt-1.5 text-xs flex items-center gap-1 ${passwordValid ? 'text-emerald-600' : 'text-ink-400'}`}>
                  <Check className="w-3 h-3" />
                  At least 8 characters
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !passwordValid}
              className="w-full btn btn-primary py-3.5 text-base"
            >
              {loading ? 'Creating…' : <>Create account <ArrowRight className="w-4 h-4" /></>}
            </button>
            <p className="text-xs text-ink-400 text-center">
              By signing up, you agree to our terms of service.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
