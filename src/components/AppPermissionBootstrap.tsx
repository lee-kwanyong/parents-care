'use client'

import { useEffect } from 'react'

const ACCESSIBILITY_KEY = 'anbuworks_accessibility_preferences'

type AccessibilityPreferences = {
  largeText?: boolean
  highContrast?: boolean
  reduceMotion?: boolean
}

function readPreferences(): AccessibilityPreferences {
  try {
    return JSON.parse(window.localStorage.getItem(ACCESSIBILITY_KEY) || '{}')
  } catch {
    return {}
  }
}

function applyAccessibilityPreferences() {
  if (typeof document === 'undefined') return

  const preferences = readPreferences()
  const root = document.documentElement

  root.classList.toggle('anbu-large-text', Boolean(preferences.largeText))
  root.classList.toggle('anbu-high-contrast', Boolean(preferences.highContrast))
  root.classList.toggle('anbu-reduce-motion', Boolean(preferences.reduceMotion))
}

export function AppPermissionBootstrap() {
  useEffect(() => {
    applyAccessibilityPreferences()

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => null)
    }

    const handleStorage = () => applyAccessibilityPreferences()
    const handlePreferenceChange = () => applyAccessibilityPreferences()

    window.addEventListener('storage', handleStorage)
    window.addEventListener('anbuworks-accessibility-updated', handlePreferenceChange)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('anbuworks-accessibility-updated', handlePreferenceChange)
    }
  }, [])

  return null
}
