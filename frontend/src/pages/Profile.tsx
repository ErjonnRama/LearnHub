import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../store/store'
import { authApi } from '../api/client'
import { Mail, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, fetchMe } = useAuthStore()
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
  })

  const mut = useMutation({
    mutationFn: () => authApi.updateMe(form),
    onSuccess: () => { toast.success('Profile saved'); fetchMe() },
    onError: () => toast.error('Could not save'),
  })

  return (
    <div className="max-w-2xl mx-auto px-6 lg:px-8 py-10">
      <p className="text-xs uppercase tracking-widest text-ink-400 font-medium mb-2">Account</p>
      <h1 className="heading-display font-bold text-4xl tracking-tight mb-10">Your profile</h1>

      <div className="card p-8">
        <div className="flex items-center gap-5 mb-10 pb-8 border-b border-ink-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-coral-400 flex items-center justify-center">
            <span className="text-2xl font-bold text-white heading-display">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </div>
          <div>
            <h2 className="heading-display font-semibold text-xl text-ink-900">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-sm text-ink-500 flex items-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" />{user?.email}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink-500 mb-1.5 block uppercase tracking-wider">First name</label>
              <input
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 mb-1.5 block uppercase tracking-wider">Last name</label>
              <input
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-500 mb-1.5 block uppercase tracking-wider">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={4}
              className="input resize-none"
              placeholder="Tell us about yourself…"
            />
          </div>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="btn btn-primary"
          >
            <Save className="w-4 h-4" />
            {mut.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
