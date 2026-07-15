import { NextRequest, NextResponse } from 'next/server';
import { getBusinessBySlug } from '@/lib/static-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const business = getBusinessBySlug(slug);

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  return NextResponse.json({ business });
}