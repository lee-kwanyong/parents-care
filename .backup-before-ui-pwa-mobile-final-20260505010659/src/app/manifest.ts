import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '부모님 케어 플랫폼',
    short_name: '부모님케어',
    description: '부모님 걱정을 쉽게 맡기는 케어 플랫폼',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#2d72d9',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  }
}
