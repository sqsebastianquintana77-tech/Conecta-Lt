import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/reviews?businessSlug=xxx
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('businessSlug');
  if (!slug) {
    return NextResponse.json({ error: 'businessSlug is required' }, { status: 400 });
  }

  try {
    const { db } = await import('@/lib/prisma');
    const reviews = await db.review.findMany({
      where: { businessSlug: slug },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ reviews });
  } catch {
    // If DB not available, return empty
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

    const { db } = await import('@/lib/prisma');

    // Find user in DB
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    const review = await db.review.create({
      data: {
        businessSlug,
        userId: user?.id ?? session.user.email,
        authorName: session.user.name ?? 'Anónimo',
        rating,
        comment: comment?.trim() || null,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Error al crear reseña' }, { status: 500 });
  }
}