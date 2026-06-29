// Shared structured-data helpers. BreadcrumbList still earns rich results
// (the breadcrumb trail in SERPs), unlike HowTo/FAQ which Google deprecated in 2023.
const BASE = 'https://clearsparradio.binnacleai.com'

export function breadcrumbLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: BASE + it.path,
    })),
  }
}
