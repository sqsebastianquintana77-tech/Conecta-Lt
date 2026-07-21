import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  // Verificar que el usuario esta autenticado
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Verificar que el email es admin
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length > 0 && !adminEmails.includes(session.user.email!.toLowerCase())) {
    return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
  }

  try {
    // Business stats
    const { count: totalBusinesses } = await supabaseAdmin
      .from('Business')
      .select('*', { count: 'exact', head: true });

    const { count: verifiedBusinesses } = await supabaseAdmin
      .from('Business')
      .select('*', { count: 'exact', head: true })
      .eq('verified', true);

    const { count: featuredBusinesses } = await supabaseAdmin
      .from('Business')
      .select('*', { count: 'exact', head: true })
      .eq('featured', true);

    // Category breakdown
    const { count: licoreriaCount } = await supabaseAdmin
      .from('Business')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'LICORERIA');

    const { count: tascaCount } = await supabaseAdmin
      .from('Business')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'TASCA');

    const { count: bodegonCount } = await supabaseAdmin
      .from('Business')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'BODEGON');

    // User stats
    const { count: totalUsers } = await supabaseAdmin
      .from('User')
      .select('*', { count: 'exact', head: true });

    // Review stats
    const { count: totalReviews } = await supabaseAdmin
      .from('Review')
      .select('*', { count: 'exact', head: true });

    // Promotion stats
    const { count: activePromotions } = await supabaseAdmin
      .from('Promotion')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    // Recent reviews (last 10) - SIN email expuesto
    const { data: recentReviews } = await supabaseAdmin
      .from('Review')
      .select('id, rating, comentario, createdAt, userId, businessId, User(name, image)')
      .order('createdAt', { ascending: false })
      .limit(10);

    // Top rated businesses
    const { data: topRated } = await supabaseAdmin
      .from('Business')
      .select('id, name, slug, category, rating, reviewCount')
      .order('rating', { ascending: false })
      .limit(5);

    // Reviews per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: recentReviewData } = await supabaseAdmin
      .from('Review')
      .select('createdAt')
      .gte('createdAt', thirtyDaysAgo.toISOString());

    // Group by date
    const reviewsByDate: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      reviewsByDate[key] = 0;
    }
    (recentReviewData ?? []).forEach((r) => {
      const key = r.createdAt?.split('T')[0];
      if (key && reviewsByDate[key] !== undefined) {
        reviewsByDate[key]++;
      }
    });

    // Zone breakdown
    const { data: allBiz } = await supabaseAdmin
      .from('Business')
      .select('zone');
    const zoneCounts: Record<string, number> = {};
    (allBiz ?? []).forEach((b) => {
      zoneCounts[b.zone] = (zoneCounts[b.zone] ?? 0) + 1;
    });

    return NextResponse.json({
      businesses: {
        total: totalBusinesses ?? 0,
        verified: verifiedBusinesses ?? 0,
        featured: featuredBusinesses ?? 0,
        byCategory: {
          LICORERIA: licoreriaCount ?? 0,
          TASCA: tascaCount ?? 0,
          BODEGON: bodegonCount ?? 0,
        },
      },
      users: {
        total: totalUsers ?? 0,
      },
      reviews: {
        total: totalReviews ?? 0,
        recent: recentReviews ?? [],
        chartData: Object.entries(reviewsByDate).map(([date, count]) => ({
          date,
          count,
        })),
      },
      promotions: {
        active: activePromotions ?? 0,
      },
      topRated: topRated ?? [],
      zones: zoneCounts,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
