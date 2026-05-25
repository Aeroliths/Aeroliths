// Dynamic sitemap - static routes + published news

const SITE_URL = 'https://aeroliths.fr'

type StaticEntry = {
  path: string
  changefreq: string
  priority: string
}

const STATIC_ENTRIES: StaticEntry[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/rules', changefreq: 'monthly', priority: '0.9' },
  { path: '/news', changefreq: 'weekly', priority: '0.8' },
  { path: '/login', changefreq: 'yearly', priority: '0.4' },
  { path: '/register', changefreq: 'yearly', priority: '0.6' },
  { path: '/legal', changefreq: 'yearly', priority: '0.2' },
]

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export default defineEventHandler(async (event) => {
  const news = await db.postgres.news.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: { publishedAt: 'desc' },
  })

  const urls: string[] = []

  for (const entry of STATIC_ENTRIES) {
    urls.push(
      `  <url>\n    <loc>${SITE_URL}${entry.path}</loc>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`
    )
  }

  for (const item of news) {
    const lastmod = (item.updatedAt ?? item.publishedAt ?? new Date()).toISOString()
    urls.push(
      `  <url>\n    <loc>${SITE_URL}/news/${escapeXml(item.slug)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`
    )
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')

  return xml
})
