import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Wilco — Radio Training',
    short_name: 'Wilco',
    description: 'Aviation radio communications training — graded ATC readbacks + offline ground school.',
    start_url: '/train',
    display: 'standalone',
    background_color: '#0b0f14',
    theme_color: '#0b0f14',
  }
}
