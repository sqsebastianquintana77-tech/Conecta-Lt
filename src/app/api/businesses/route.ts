import { NextRequest, NextResponse } from 'next/server';
import { getBusinessesWithFilters } from '@/lib/static-data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') || '';
  const zone = searchParams.get('zone') || '';
  const search = searchParams.get('search') || '';
  const featured = searchParams.get('featured') === 'true';

  const data = getBusinessesWithFilters({
    category: category || undefined,
    zone: zone || undefined,
    search: search || undefined,
    featured: featured || undefined,
  });

  return NextResponse.json(data);
}