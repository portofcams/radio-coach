import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/profile', '/cfi', '/school', '/success'] },
    sitemap: 'https://wilco.binnacleai.com/sitemap.xml',
  }
}
