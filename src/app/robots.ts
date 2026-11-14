import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexa.edu.vn';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/framework', '/auth/'],
        disallow: ['/admin/', '/personal/', '/org/', '/verify/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
