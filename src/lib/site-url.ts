export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || ''

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin.replace(/\/$/, '')
  }

  return 'https://parents-care.net'
}

export function getAuthCallbackUrl(nextPath = '/signup/guardian') {
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`
}
