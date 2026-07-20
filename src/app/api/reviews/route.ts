import NextRequest, { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/rate-limit';

// GET /api/reviews?businessSlug=xxx
export async function GET(request: NextRequest) {
  const { allowed } = rateLimit(request);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }
  const slug = request.nextUrl.searchParams.get('businessSlug');
  if (!slug) {
    return NextResponse.json({ error: 'businessSlug is required' }, { status: 400 });
  }

  try {
    const { data: reviews, error } = await supabase
      .from('Review')
      .select('*')
      .eq('businessSlug', slug)
      .order('createdAt', { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ reviews: reviews ?? [] });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}

// POST /api/reviews
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { businessSlug, rating, comment } = body;

    if (!businessSlug || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'businessSlug y rating (1-5) son requeridos' },
        { status: 400 }
      );
    }

    // Find or create user
    const { data: existingUser } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single();

    let userId = existingUser?.id;

    if (!userId) {
      const { data: newUser } = await supabaseAdmin
        .from('User')
        .insert({
          id: crypto.randomUUID(),
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
          emailVerified: new Date().toISOString(),
        })
        .select('id')
        .single();
      userId = newUser?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
    }

    const { data: review, error } = await supabaseAdmin
      .from('Review')
      .insert({
        id: crypto.randomUUID(),
        businessSlug,
        userId,
        authorName: session.user.name ?? 'Anónimo',
        rating,
        comment: comment?.trim() || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Error al crear reseña' }, { status: 500 });
  }
}