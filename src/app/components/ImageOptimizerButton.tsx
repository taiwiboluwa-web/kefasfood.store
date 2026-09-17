import { useEffect, useState } from 'react'
import { ImageDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function ImageOptimizerButton() {
  const [running, setRunning] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(window.location.pathname === '/admin' && sessionStorage.getItem('kefas_admin_auth') === 'true')
    }
    updateVisibility()
    const interval = window.setInterval(updateVisibility, 500)
    return () => window.clearInterval(interval)
  }, [])

  const optimizeImages = async () => {
    if (running) return
    const confirmed = window.confirm(
      'Optimize uploaded product images now? Images are compressed for web while keeping their existing Blob paths and product records.'
    )
    if (!confirmed) return

    setRunning(true)
    try {
      const response = await fetch('/api/optimize-images', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        cache: 'no-store',
      })
      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.ok) {
        const message = data?.error || (data?.failed ? `Optimization finished with ${data.failed} failure(s).` : 'Image optimization failed.')
        throw new Error(message)
      }

      if (data.optimized > 0) {
        toast.success(
          `Optimized ${data.optimized} image${data.optimized === 1 ? '' : 's'} — saved ${formatBytes(data.savedBytes)} (${data.savedPercent}%).`
        )
      } else {
        toast.success(`All ${data.scanned} uploaded image${data.scanned === 1 ? '' : 's'} are already optimized.`)
      }
    } catch (error: any) {
      console.error('Admin image optimization failed:', error)
      toast.error(error?.message || 'Could not optimize images.')
    } finally {
      setRunning(false)
    }
  }

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={optimizeImages}
      disabled={running}
      className="fixed bottom-5 right-5 z-[100] inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-wait disabled:opacity-70 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
      title="Compress uploaded product images for faster web delivery"
    >
      {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}
      {running ? 'Optimizing…' : 'Optimize Images'}
    </button>
  )
}
