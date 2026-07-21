import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { allBusinesses, enrichedReviews } from '@/lib/static-data';
import BusinessDetailClient from './BusinessDetailClient';

const SITE_URL = 'https://conecta-lt.vercel.app';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generar rutas estáticas para todos los negocios (SSG)
export async function generateStaticParams() {
  return allBusinesses.map((b) => ({ slug: b.slug }));
}

// Metadata dinámica para SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = allBusinesses.find((b) => b.slug === slug);
  if (!business) return {};

  const categoryLabel: Record<string, string> = {
    LICORERIA: 'Licorería',
    TASCA: 'Tasca',
    BODEGON: 'Bodegón',
  };
  const title = `${business.name} | ${categoryLabel[business.category] ?? business.category} en Los Teques - Conecta-Lt`;
  const description = business.description
    ?? `${business.name} — ${business.specialty ?? categoryLabel[business.category] ?? 'Negocio'} en ${business.zone}, Los Teques. Rating: ${business.rating} estrellas. ${business.hasDelivery ? 'Con delivery. ' : ''}${business.hours ?? ''}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/businesses/${slug}`,
      type: 'website',
      locale: 'es_VE',
      siteName: 'Conecta-Lt',
      images: business.image ? [{ url: business.image, width: 1200, height: 630, alt: business.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: business.image ? [business.image] : [],
    },
    alternates: {
      canonical: `${SITE_URL}/businesses/${slug}`,
    },
  };
}

export default async function BusinessPage({ params }: PageProps) {
  const { slug } = await params;
  const business = allBusinesses.find((b) => b.slug === slug);
  if (!business) notFound();

  const reviews = enrichedReviews.filter((r) => r.businessId === business.id);

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description ?? `${business.name} - ${business.specialty ?? 'Negocio de bebidas'} en Los Teques`,
    url: `${SITE_URL}/businesses/${slug}`,
    image: business.image ?? `${SITE_URL}/logo.svg`,
    telephone: business.phone ?? undefined,
    address: business.address
      ? { '@type': 'PostalAddress', streetAddress: business.address, addressLocality: 'Los Teques', addressRegion: 'Miranda', addressCountry: 'VE' }
      : undefined,
    geo: business.latitude && business.longitude
      ? { '@type': 'GeoCoordinates', latitude: business.latitude, longitude: business.longitude }
      : undefined,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: business.rating,
      reviewCount: business.reviewCount,
      bestRating: 5,
    },
    priceRange: business.priceRange,
    openingHours: business.hours ?? undefined,
    servesCuisine: business.category === 'TASCA' ? 'Venezolana' : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BusinessDetailClient business={business} reviews={reviews} />
    </>
  );
}