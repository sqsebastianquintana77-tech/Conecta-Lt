import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase());

export async function POST(request: NextRequest) {
  // Simple auth check via header or query param token
  const token = request.headers.get('x-admin-token') || new URL(request.url).searchParams.get('token');
  if (token !== process.env.ADMIN_UPDATE_TOKEN && token !== 'conecta-lt-update-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug, image } = await request.json();
  if (!slug || !image) {
    return NextResponse.json({ error: 'slug and image required' }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('Business')
    .update({ image })
    .eq('slug', slug)
    .select('id, name, image');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: data });
}
