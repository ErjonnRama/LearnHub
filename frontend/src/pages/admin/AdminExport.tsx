import { useState } from 'react'
import { Download, Upload, FileText, FileSpreadsheet, FileJson } from 'lucide-react'
import { exportApi } from '../../api/client'
import toast from 'react-hot-toast'

const LISTS = [
  { key: 'courses', label: 'Courses', desc: 'All published & draft courses' },
  { key: 'enrollments', label: 'Enrollments', desc: 'Student enrollments' },
  { key: 'users', label: 'Users', desc: 'Registered users' },
  { key: 'reviews', label: 'Reviews', desc: 'Course ratings & comments' },
  { key: 'payments', label: 'Payments', desc: 'Payment transactions' },
  { key: 'categories', label: 'Categories', desc: 'Course categories' },
  { key: 'audit_logs', label: 'Audit logs', desc: 'System activity log' },
]

const FORMATS = [
  { value: 'csv', label: 'CSV', icon: FileText, color: 'text-emerald-400' },
  { value: 'excel', label: 'Excel', icon: FileSpreadsheet, color: 'text-emerald-400' },
  { value: 'json', label: 'JSON', icon: FileJson, color: 'text-amber-400' },
]

export default function AdminExport() {
  const [downloading, setDownloading] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const doExport = async (listName: string, format: string) => {
    const key = `${listName}-${format}`
    setDownloading(key)
    try {
      const res = await exportApi.export(listName, format)
      const ext = format === 'excel' ? 'xlsx' : format
      const blob = new Blob([res.data])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${listName}-${new Date().toISOString().slice(0, 10)}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${listName} exported`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Export failed')
    } finally {
      setDownloading(null)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await exportApi.importCourses(file)
      toast.success(`Imported ${res.data.imported || 0} courses`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Import failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-stone-400 font-medium mb-2">Data</p>
        <h1 className="heading-display font-bold text-4xl text-white tracking-tight">
          Import & export
        </h1>
        <p className="text-sm text-stone-400 mt-2">Download data in CSV, Excel, or JSON. Import Kaggle Udemy courses.</p>
      </div>

      {/* Import */}
      <div className="bg-gradient-to-br from-brand-500/10 to-coral-500/10 border border-brand-500/20 rounded-2xl p-6 mb-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="heading-display font-semibold text-lg text-white mb-1">Import courses</h2>
            <p className="text-sm text-stone-400">Upload a Udemy Kaggle CSV to bulk-import courses</p>
          </div>
          <label className="btn bg-cream-50 text-ink-900 hover:bg-surface cursor-pointer shrink-0">
            <Upload className="w-4 h-4" />
            {uploading ? 'Importing…' : 'Upload CSV'}
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Export grid */}
      <h2 className="heading-display font-semibold text-lg text-white mb-5">Export data</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LISTS.map(({ key, label, desc }) => (
          <div key={key} className="bg-night border border-night-700 rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="heading-display font-semibold text-base text-white">{label}</h3>
              <p className="text-xs text-stone-400 mt-0.5">{desc}</p>
            </div>
            <div className="flex gap-2">
              {FORMATS.map(({ value, label: fmtLabel, icon: Icon, color }) => {
                const isLoading = downloading === `${key}-${value}`
                return (
                  <button
                    key={value}
                    onClick={() => doExport(key, value)}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-night-800 hover:bg-ink-700 text-xs text-ink-200 transition-colors disabled:opacity-50"
                  >
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    {isLoading ? '…' : fmtLabel}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
