export default function LoadingSpinner({ fullPage }: { fullPage?: boolean }) {
  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream-50">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-ink-100 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-brand-600 rounded-full animate-spin" />
        </div>
      </div>
    )
  }
  return (
    <div className="relative inline-block">
      <div className="w-6 h-6 border-2 border-ink-100 rounded-full" />
      <div className="absolute inset-0 w-6 h-6 border-2 border-transparent border-t-brand-600 rounded-full animate-spin" />
    </div>
  )
}
