import { MetadataRoute } from 'next';
import { allBusinesses } from '@/lib/static-data';

const SITE_URL = 'https://conecta-lt.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const businessPages = allBusinesses.map((b) => ({
    url: `${SITE_URL}/businesses/${b.slug}`,
    lastModified: new Date(b.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...businessPages,
  ];
}