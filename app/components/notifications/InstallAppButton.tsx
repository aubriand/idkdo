'use client'
import { useEffect, useState } from 'react'
import Button from '@/app/components/ui/Button'

type BeforeInstallPromptEvent = Event & {
  prompt: () => void
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallAppButton({ className = '' }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window))

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  if (isStandalone) return null

  const canInstall = !!deferredPrompt || isIOS

  const onClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      return
    }
    if (isIOS) {
      // Simple inline hint for iOS
      alert('Sur iOS: touchez ⎋ Partager, puis « Sur l’écran d\'accueil ».')
    }
  }

  return (
    <Button onClick={onClick} disabled={!canInstall} className={className} variant="secondary">
      Installer l’app
    </Button>
  )
}
