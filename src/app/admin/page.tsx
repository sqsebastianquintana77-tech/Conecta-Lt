'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Users,
  Star,
  Store,
  Wine,
  Beer,
  ShoppingBag,
  Tag,
  TrendingUp,
  Calendar,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface AdminStats {
  businesses: {
    total: number;
    verified: number;
    featured: number;
    byCategory: { LICORERIA: number; TASCA: number; BODEGON: number };
  };
  users: { total: number };
  reviews: {
    total: number;
    recent: Array<{
      id: string;
      authorName: string;
      rating: number;
      comment: string | null;
      businessSlug: string;
      createdAt: string;
      User?: { name: string; email: string; image: string | null };
    }>;
    chartData: Array<{ date: string; count: number }>;
  };
  promotions: { active: number };
  topRated: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    rating: number;
    reviewCount: number;
  }>;
  zones: Record<string, number>;
}

const CATEGORY_LABELS: Record<string, string> = {
  LICORERIA: 'Licorerías',
  TASCA: 'Tascas',
  BODEGON: 'Bodegones',
};

const CATEGORY_COLORS: Record<string, string> = {
  LICORERIA: 'bg-amber-500',
  TASCA: 'bg-orange-500',
  BODEGON: 'bg-emerald-500',
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
    // Verificar que el email del usuario está en la lista de admins
    if (session?.user?.email) {
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase());
      if (adminEmails.length > 0 && !adminEmails.includes(session.user.email.toLowerCase())) {
        setForbidden(true);
      }
    }
  }, [status, session, router]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setLastRefresh(new Date().toLocaleTimeString('es-VE'));
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && !forbidden) fetchStats();
  }, [session, forbidden]);

  if (forbidden) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <ShieldCheck size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Acceso restringido</h2>
          <p className="text-gray-400 text-sm">No tenés permisos de administrador.</p>
          <Button variant="outline" onClick={() => router.push('/')}>
            <ArrowLeft size={16} className="mr-2" />
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const maxChartValue = Math.max(...(stats?.reviews.chartData.map((d) => d.count) ?? [1]), 1);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
            <Separator orientation="vertical" className="h-6 bg-gray-700" />
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-amber-500" />
              <h1 className="text-lg font-bold">Panel de Administración</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-xs text-gray-500 hidden sm:block">
                Actualizado: {lastRefresh}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={loading}
              className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            {session.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name ?? ''}
                className="h-8 w-8 rounded-full"
              />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={<Store className="h-5 w-5" />}
            label="Negocios"
            value={stats?.businesses.total ?? 0}
            sublabel={`${stats?.businesses.verified ?? 0} verificados`}
            color="text-amber-500"
            bgColor="bg-amber-500/10"
            loading={loading}
          />
          <KPICard
            icon={<Users className="h-5 w-5" />}
            label="Usuarios"
            value={stats?.users.total ?? 0}
            sublabel="registrados con Google"
            color="text-blue-500"
            bgColor="bg-blue-500/10"
            loading={loading}
          />
          <KPICard
            icon={<MessageSquare className="h-5 w-5" />}
            label="Reseñas"
            value={stats?.reviews.total ?? 0}
            sublabel="de usuarios reales"
            color="text-green-500"
            bgColor="bg-green-500/10"
            loading={loading}
          />
          <KPICard
            icon={<Tag className="h-5 w-5" />}
            label="Promociones"
            value={stats?.promotions.active ?? 0}
            sublabel="activas"
            color="text-purple-500"
            bgColor="bg-purple-500/10"
            loading={loading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reviews Chart */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Reseñas últimos 30 días
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-48 w-full bg-gray-800" />
              ) : (
                <div className="h-48 flex items-end gap-[2px]">
                  {stats?.reviews.chartData.map((d) => {
                    const height = d.count > 0 ? Math.max((d.count / maxChartValue) * 100, 4) : 4;
                    return (
                      <div
                        key={d.date}
                        className="flex-1 flex flex-col items-center gap-1 group"
                      >
                        <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          {d.count}
                        </span>
                        <div
                          className="w-full bg-green-500/70 hover:bg-green-500 rounded-t transition-colors min-h-[4px]"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-[8px] text-gray-600 hidden lg:block">
                          {d.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories Breakdown */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-500" />
                Distribución por categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full bg-gray-800" />
                  <Skeleton className="h-8 w-full bg-gray-800" />
                  <Skeleton className="h-8 w-full bg-gray-800" />
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(stats?.businesses.byCategory ?? {}).map(([cat, count]) => {
                    const total = stats?.businesses.total ?? 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">{CATEGORY_LABELS[cat] ?? cat}</span>
                          <span className="text-gray-400">{count} ({pct}%)</span>
                        </div>
                        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${CATEGORY_COLORS[cat] ?? 'bg-gray-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Rated */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Mejor calificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full bg-gray-800" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {stats?.topRated.map((b, i) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-gray-500 w-4">{i + 1}</span>
                        <span className="text-sm text-gray-200 truncate">{b.name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold text-yellow-400">{b.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Zones */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Wine className="h-4 w-4 text-red-500" />
                Negocios por zona
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full bg-gray-800" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats?.zones ?? {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([zone, count]) => (
                      <div
                        key={zone}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                      >
                        <span className="text-sm text-gray-200">{zone}</span>
                        <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                          {count}
                        </Badge>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Reseñas recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full bg-gray-800" />
                  ))}
                </div>
              ) : stats?.reviews.recent.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Aún no hay reseñas de usuarios
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {stats?.reviews.recent.map((r) => (
                    <div
                      key={r.id}
                      className="p-2 rounded-lg bg-gray-800/50 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-200 truncate max-w-[140px]">
                          {r.authorName}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i <= r.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {r.comment && (
                        <p className="text-xs text-gray-400 line-clamp-2">{r.comment}</p>
                      )}
                      <span className="text-[10px] text-gray-600">
                        {new Date(r.createdAt).toLocaleDateString('es-VE')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

// ── KPI Card Component ──────────────────────────────────────────────────

function KPICard({
  icon,
  label,
  value,
  sublabel,
  color,
  bgColor,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sublabel: string;
  color: string;
  bgColor: string;
  loading: boolean;
}) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-20 bg-gray-800" />
            <Skeleton className="h-8 w-12 bg-gray-800" />
            <Skeleton className="h-3 w-28 bg-gray-800" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{sublabel}</p>
            </div>
            <div className={`p-2.5 rounded-xl ${bgColor} ${color}`}>
              {icon}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}