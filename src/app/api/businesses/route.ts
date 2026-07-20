import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') || '';
  const zone = searchParams.get('zone') || '';
  const search = searchParams.get('search') || '';
  const featured = searchParams.get('featured') === 'true';

  try {
    let query = supabase.from('Business').select('*');

    if (category) {
      query = query.eq('category', category);
    }
    if (zone) {
      query = query.eq('zone', zone);
    }
    if (search) {
      const q = `%${search}%`;
      query = query.or(
        `name.ilike.${q},specialty.ilike.${q},"topBrands".ilike.${q},subcategory.ilike.${q},description.ilike.${q}`
      );
    }

    const { data: businesses, error } = await query;

    if (error) throw error;

    // Fetch promotions for all businesses
    const { data: promotions } = await supabase
      .from('Promotion')
      .select('*')
      .eq('active', true);

    // Fetch static reviews from static-data (seeded reviews)
    const { enrichedReviews } = await import('@/lib/static-data');

    // Enrich businesses with promotions and reviews
    const enriched = (businesses ?? []).map((b) => ({
      ...b,
      promotions: (promotions ?? []).filter((p) => p.businessId === b.id),
      reviews: enrichedReviews.filter((r) => r.businessId === b.id),
    }));

    // Sort: featured first, then by rating
    enriched.sort((a, b) => {
      if (featured) return b.rating - a.rating;
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.rating - a.rating;
    });

    // Build stats
    const allBusinesses = businesses ?? [];
    const allPromotions = promotions ?? [];
    const stats = {
      total: allBusinesses.length,
      licorerias: allBusinesses.filter((b) => b.category === 'LICORERIA').length,
      tascas: allBusinesses.filter((b) => b.category === 'TASCA').length,
      bodegones: allBusinesses.filter((b) => b.category === 'BODEGON').length,
      verified: allBusinesses.filter((b) => b.verified).length,
      promotions: allPromotions.length,
      zones: [...new Set(allBusinesses.map((b) => b.zone))],
    };

    return NextResponse.json({ businesses: enriched, stats });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json({ businesses: [], stats: { total: 0, licorerias: 0, tascas: 0, bodegones: 0, verified: 0, promotions: 0, zones: [] } });
  }
}