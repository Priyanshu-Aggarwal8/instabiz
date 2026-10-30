import { MetadataRoute } from 'next';
import { puppies } from '@/data/puppies';
import { goneHomePuppies } from '@/data/goneHome';
import { siteConfig } from '@/data/siteConfig';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/puppies',
    '/gone-home',
    '/happy-families',
    '/how-it-works',
    '/faq',
    '/contact',
  ].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const puppyRoutes = puppies.map((p) => ({
    url: `${siteConfig.url}/puppies/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  const goneHomeRoutes = goneHomePuppies.map((p) => ({
    url: `${siteConfig.url}/puppies/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...routes, ...puppyRoutes, ...goneHomeRoutes];
}

