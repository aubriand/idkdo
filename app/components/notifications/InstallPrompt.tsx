'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Button from '@/app/components/ui/Button'

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  type BeforeInstallPromptEvent = Event & { prompt: () => void; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [snoozed, setSnoozed] = useState(false)

  useEffect(() => {
    // Check snooze state
    try {
      const raw = localStorage.getItem('a2hs_snooze_until')
      if (raw) {
        const until = parseInt(raw, 10)
        if (!Number.isNaN(until) && Date.now() < until) setSnoozed(true)
      }
    } catch {}

    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window))
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    const handler = (e: Event) => {
      const bip = e as BeforeInstallPromptEvent
      e.preventDefault()
      setDeferredPrompt(bip)
      setOpen(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (isStandalone || snoozed) return null

  const onInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') setOpen(false)
      setDeferredPrompt(null)
    }
  }

  const onLater = () => {
    setOpen(false)
    try {
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      localStorage.setItem('a2hs_snooze_until', String(Date.now() + sevenDays))
    } catch {}
  }

  const content = (
    <div className={`fixed inset-x-0 bottom-4 z-[200] px-4 transition ${open || isIOS ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`} style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto max-w-xl rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-lg p-4" role="dialog" aria-live="polite">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📲</div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Installer IDKDO</h3>
            {isIOS ? (
              <p className="text-[var(--foreground-secondary)] text-sm">
                Sur iOS: touchez <span aria-hidden>⎋</span> Partager, puis « Sur l’écran d’accueil ».
              </p>
            ) : (
              <p className="text-[var(--foreground-secondary)] text-sm">
                Installez l’app pour un accès rapide et des notifications.
              </p>
            )}
          </div>
          <button className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)]" onClick={onLater} aria-label="Fermer">✕</button>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          {isIOS ? (
            <Button onClick={onLater} variant="secondary">Compris</Button>
          ) : (
            <>
              <Button onClick={onLater} variant="ghost">Plus tard</Button>
              <Button onClick={onInstall}>Installer</Button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  if (typeof window !== 'undefined') {
    return createPortal(content, document.body)
  }
  return content
}