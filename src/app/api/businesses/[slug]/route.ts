import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { allowed } = rateLimit(request);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }
  const { slug } = await params;

  try {
    const { data: business, error } = await supabaseAdmin
      .from('Business')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    // Fetch promotions from Supabase
    const { data: supabasePromotions } = await supabaseAdmin
      .from('Promotion')
      .select('*')
      .eq('businessId', business.id);

    // Fetch static data (has gallery + extra promotions)
    const { allBusinesses, enrichedReviews } = await import('@/lib/static-data');
    const staticBiz = allBusinesses.find((b) => b.id === business.id);

    // Merge gallery: static images if Supabase has none
    const supabaseGallery = Array.isArray(business.gallery) ? business.gallery : [];
    const staticGallery = staticBiz?.gallery ?? [];
    const mergedGallery = supabaseGallery.length > 0 ? supabaseGallery : staticGallery;

    // Merge promotions: Supabase first, then fill gaps with static
    const dbPromos = supabasePromotions ?? [];
    const staticPromos = staticBiz?.promotions ?? [];
    const dbTitles = new Set(dbPromos.map((p: { title: string }) => p.title));
    const extraPromos = staticPromos.filter((p: { title: string }) => !dbTitles.has(p.title));
    const mergedPromotions = [...dbPromos, ...extraPromos];

    const enriched = {
      ...business,
      gallery: mergedGallery,
      promotions: mergedPromotions,
      reviews: enrichedReviews.filter((r) => r.businessId === business.id),
    };

    return NextResponse.json({ business: enriched });
  } catch (error) {
    console.error('Error fetching business by slug:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
