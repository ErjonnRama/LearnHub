import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/store'
import { ArrowRight, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      toast.success('Welcome back')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid email or password')
    }
  }

  const fillDemo = () => {
    setEmail('admin@learnhub.com')
    setPassword('Admin1234!')
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2 -mt-16 pt-16">
      {/* Left — form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-slide-up">
          <h1 className="heading-display font-bold text-4xl tracking-tight mb-2">
            Welcome back<span className="text-coral-500">.</span>
          </h1>
          <p className="text-ink-500 mb-8 text-sm">
            New here? <Link to="/register" className="text-brand-700 hover:text-brand-800 font-medium underline-offset-4 hover:underline">Create an account</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-500 mb-1.5 block uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 mb-1.5 block uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3.5 text-base"
            >
              {loading ? 'Signing in…' : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          {/* Demo credentials */}
          <button
            onClick={fillDemo}
            type="button"
            className="mt-4 w-full text-xs text-ink-500 hover:text-brand-700 transition-colors text-center py-2 border border-dashed border-ink-200 rounded-xl"
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            Use demo admin credentials
          </button>
        </div>
      </div>

      {/* Right — editorial visual */}
      <div className="hidden lg:flex relative items-center justify-center bg-night text-white p-12 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-violet opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-grain opacity-30 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10 max-w-md">
          <p className="text-xs uppercase tracking-widest text-coral-400 font-medium mb-4">A note from the team</p>
          <blockquote className="heading-display text-3xl leading-tight font-medium">
            <span className="text-5xl text-brand-300 leading-none">"</span>
            <br />
            Learning is the only investment that never depreciates.
            <span className="text-5xl text-brand-300 leading-none">"</span>
          </blockquote>
          <div className="mt-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-coral-400" />
            <div>
              <p className="text-sm font-medium">The Learnhub Team</p>
              <p className="text-xs text-ink-400">Built for Lab Course 2</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
