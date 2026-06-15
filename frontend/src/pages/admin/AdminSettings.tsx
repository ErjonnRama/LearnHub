import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import api from '../../api/client'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'

const FIELDS = [
  { key: 'site_name', label: 'Site name', hint: 'Shown in browser title' },
  { key: 'site_tagline', label: 'Tagline', hint: 'Short site description' },
  { key: 'hero_title', label: 'Hero title', hint: 'Big headline on homepage' },
  { key: 'hero_subtitle', label: 'Hero subtitle', hint: 'Supporting text on homepage' },
  { key: 'contact_email', label: 'Contact email', hint: 'Public contact address' },
  { key: 'courses_per_page', label: 'Courses per page', hint: 'Pagination size' },
  { key: 'allow_free_enrollment', label: 'Allow free enrollment', hint: '"true" or "false"' },
]

export default function AdminSettings() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const { data } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => (await adminApi.settings()).data,
  })

  useEffect(() => {
    if (data) setValues(data)
  }, [data])

  const save = async (key: string) => {
    setSaving(key)
    try {
      await api.put(`/admin/settings/${key}`, { value: values[key] || '' })
      toast.success(`Saved`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-stone-400 font-medium mb-2">CMS</p>
        <h1 className="heading-display font-bold text-4xl text-white tracking-tight">Settings</h1>
        <p className="text-sm text-stone-400 mt-2">Edit site-wide content shown to users</p>
      </div>

      <div className="bg-night border border-night-700 rounded-2xl p-6 space-y-5">
        {FIELDS.map(({ key, label, hint }) => (
          <div key={key} className="pb-5 border-b border-night-700 last:border-0 last:pb-0">
            <label className="block text-sm font-medium text-white mb-1">{label}</label>
            <p className="text-xs text-stone-400 mb-3">{hint}</p>
            <div className="flex gap-2">
              <input
                value={values[key] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                className="flex-1 bg-night-800 border border-ink-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-500 outline-none focus:border-brand-500 transition-colors"
                placeholder={`Enter ${label.toLowerCase()}…`}
              />
              <button
                onClick={() => save(key)}
                disabled={saving === key}
                className="btn bg-cream-50 text-ink-900 hover:bg-surface"
              >
                <Save className="w-3.5 h-3.5" />
                {saving === key ? '…' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
