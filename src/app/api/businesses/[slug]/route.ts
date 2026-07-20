import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const { data: business, error } = await supabase
      .from('Business')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    // Fetch promotions for this business
    const { data: promotions } = await supabase
      .from('Promotion')
      .select('*')
      .eq('businessId', business.id);

    // Fetch static (seeded) reviews
    const { enrichedReviews } = await import('@/lib/static-data');

    const enriched = {
      ...business,
      promotions: promotions ?? [],
      reviews: enrichedReviews.filter((r) => r.businessId === business.id),
    };

    return NextResponse.json({ business: enriched });
  } catch (error) {
    console.error('Error fetching business by slug:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
