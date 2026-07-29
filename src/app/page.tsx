'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wine,
  Beer,
  Store,
  Search,
  Star,
  ShieldCheck,
  Truck,
  PawPrint,
  Clock,
  CalendarCheck,
  MessageCircle,
  Instagram,
  ChevronRight,
  Tag,
  MapPin,
  Phone,
  PartyPopper,
  X,
  Sparkles,
  Globe,
  ChevronLeft,
} from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

// ── Types ──────────────────────────────────────────────────────────────────

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount: string | null;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  businessId: string;
}

interface Review {
  id: string;
  author: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface DynamicReview {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  category: 'LICORERIA' | 'TASCA' | 'BODEGON';
  subcategory: string | null;
  zone: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  hours: string | null;
  happyHour: string | null;
  priceRange: string;
  hasDelivery: boolean;
  petFriendly: boolean;
  hasReservations: boolean;
  specialty: string | null;
  topBrands: string | null;
  description: string | null;
  rating: number;
  reviewCount: number;
  verified: boolean;
  featured: boolean;
  image: string | null;
  gallery: string[];
  tags: string[];
  latitude: number | null;
  longitude: number | null;
  promotions: Promotion[];
  reviews: Review[];
}

interface Stats {
  total: number;
  licorerias: number;
  tascas: number;
  bodegones: number;
  verified: number;
  promotions: number;
  zones: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const ZONES = [
  'Todas',
  'Centro',
  'La Hoyada',
  'San Pedro',
  'El Trapiche',
  'Cumbres de Curumo',
  'Industrial',
];

const CATEGORY_CONFIG = {
  LICORERIA: {
    label: 'Licorerías',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    activeColor: 'bg-amber-600 text-white hover:bg-amber-700',
    pillColor: 'bg-amber-600 text-white',
    icon: Wine,
  },
  TASCA: {
    label: 'Tascas',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    activeColor: 'bg-orange-600 text-white hover:bg-orange-700',
    pillColor: 'bg-orange-600 text-white',
    icon: Beer,
  },
  BODEGON: {
    label: 'Bodegones',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    activeColor: 'bg-emerald-600 text-white hover:bg-emerald-700',
    pillColor: 'bg-emerald-600 text-white',
    icon: Store,
  },
} as const;

type CategoryKey = keyof typeof CATEGORY_CONFIG;

// ── Helper Components ──────────────────────────────────────────────────────

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-border'
          }
        />
      ))}
    </div>
  );
}

function PriceRangeIndicator({ range }: { range: string }) {
  const level = range.length;
  return (
    <span className="text-xs font-semibold tracking-wide">
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className={i < level ? 'text-primary' : 'text-border'}
        >
          $
        </span>
      ))}
    </span>
  );
}

// ── Skeleton Loaders ───────────────────────────────────────────────────────

function BusinessCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-4 space-y-3 shadow-card">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
      <Skeleton className="h-9 w-full mt-1 rounded-xl" />
    </div>
  );
}

function FeaturedCardSkeleton() {
  return (
    <div className="min-w-[280px] max-w-[320px] flex-shrink-0 rounded-2xl bg-card p-4 space-y-3 shadow-card">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-8 w-full mt-2" />
    </div>
  );
}

// ── Business Card ──────────────────────────────────────────────────────────

function BusinessCard({
  business,
  onSelect,
}: {
  business: Business;
  onSelect: (b: Business) => void;
}) {
  const config = CATEGORY_CONFIG[business.category];
  const Icon = config.icon;
  const hasActivePromo = business.promotions.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="rounded-2xl bg-card flex flex-col cursor-pointer overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300"
    >
      {/* Business image or gradient placeholder */}
      <div className="relative h-40 w-full bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-50/80 flex items-center justify-center overflow-hidden">
        {business.image ? (
          <Image
            src={business.image}
            alt={business.name}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        ) : (
          <Icon size={40} className="text-primary/25" />
        )}
        {/* Category badge overlay */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border backdrop-blur-md bg-card/85 shadow-soft ${config.color}`}
          >
            <Icon size={11} />
            {config.label}
          </span>
        </div>
        {hasActivePromo && (
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/95 text-white px-2.5 py-0.5 text-[10px] font-bold shadow-md shadow-red-500/20 backdrop-blur-sm">
              <Tag size={10} />
              {business.promotions[0].discount}
            </span>
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Name */}
      <div>
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-[13px] text-foreground leading-snug">
            {business.name}
          </h3>
          {business.verified && (
            <ShieldCheck size={14} className="text-primary flex-shrink-0" />
          )}
        </div>
        {business.subcategory && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {business.subcategory}
          </p>
        )}
      </div>

      {/* Zone + Rating row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin size={11} />
          {business.zone}
        </div>
        <div className="flex items-center gap-1.5">
          <StarRating rating={business.rating} size={11} />
          <span className="text-[11px] text-muted-foreground">
            ({business.reviewCount})
          </span>
        </div>
      </div>

      {/* Price range */}
      <PriceRangeIndicator range={business.priceRange} />

      {/* Tags (max 3) */}
      {business.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {business.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-secondary border border-border/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {business.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground self-center">
              +{business.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Feature badges */}
      <div className="flex flex-wrap gap-1.5">
        {business.hasDelivery && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Truck size={11} /> Delivery
          </span>
        )}
        {business.petFriendly && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <PawPrint size={11} /> Pet-friendly
          </span>
        )}
        {business.hasReservations && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <CalendarCheck size={11} /> Reservas
          </span>
        )}
      </div>

      {/* CTA */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-auto w-full text-primary hover:bg-primary/5 hover:text-primary/80 font-medium rounded-xl h-9 transition-colors duration-200"
        onClick={() => onSelect(business)}
      >
        Ver más
        <ChevronRight size={14} />
      </Button>
      </div>
    </motion.div>
  );
}

// ── Featured Horizontal Card ───────────────────────────────────────────────

function FeaturedCard({
  business,
  onSelect,
}: {
  business: Business;
  onSelect: (b: Business) => void;
}) {
  const config = CATEGORY_CONFIG[business.category];
  const Icon = config.icon;

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } }}
      className="group min-w-[300px] max-w-[340px] flex-shrink-0 snap-start rounded-2xl bg-card overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300"
    >
      {/* Image or placeholder */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-50/80">
        {business.image ? (
          <Image
            src={business.image}
            alt={business.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="340px"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon size={40} className="text-primary/20" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border backdrop-blur-md bg-card/85 shadow-soft ${config.color}`}
          >
            <Icon size={11} />
            {config.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 text-primary-foreground px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm shadow-md shadow-primary/20">
            <Sparkles size={10} /> Destacado
          </span>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3">
      <div>
        <h3 className="font-bold text-sm text-foreground tracking-tight">{business.name}</h3>
        {business.subcategory && (
          <p className="text-xs text-muted-foreground mt-0.5">{business.subcategory}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <MapPin size={11} />
        {business.zone}
      </div>
      <div className="flex items-center gap-2">
        <StarRating rating={business.rating} size={12} />
        <span className="text-xs text-muted-foreground">
          ({business.reviewCount})
        </span>
      </div>
      <Button
        size="sm"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
        onClick={() => onSelect(business)}
      >
        Ver detalles
        <ChevronRight size={14} />
      </Button>
      </div>
    </motion.div>
  );
}

// ── Promotion Card ─────────────────────────────────────────────────────────

function PromotionCard({ business, onSelect }: { business: Business; onSelect: (b: Business) => void }) {
  return (
    <button
      onClick={() => onSelect(business)}
      className="w-full text-left rounded-2xl bg-card p-4 flex flex-col gap-2 shadow-card border border-border/40 hover:shadow-card-hover hover:border-primary/30 transition-all duration-300"
    >
      {business.promotions.map((promo) => (
        <div key={promo.id} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground truncate">
              {business.name}
            </p>
            {promo.discount && (
              <span className="inline-flex items-center rounded-full bg-red-500/15 text-red-400 px-2.5 py-0.5 text-[10px] font-bold flex-shrink-0 border border-red-500/20">
                {promo.discount}
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-primary">{promo.title}</p>
          {promo.description && (
            <p className="text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed">
              {promo.description}
            </p>
          )}
          <p className="text-[10px] text-primary/70 font-medium">Tocá para ver detalles →</p>
        </div>
      ))}
    </button>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────

function DetailModal({
  business,
  open,
  onOpenChange,
}: {
  business: Business | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: session } = useSession();
  const [detail, setDetail] = useState<Business | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  // Debounce para navegación — impide doble-disparo en móvil
  const galleryNavTime = useRef(0);
  const promoNavTime = useRef(0);
  const [expandedPromo, setExpandedPromo] = useState<Promotion | null>(null);
  const [promoIndex, setPromoIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, submittingReviewSet] = useState(false);
  const [dynamicReviews, setDynamicReviews] = useState<DynamicReview[]>([]);

  useEffect(() => {
    if (!business || !open) return;
    fetch(`/api/businesses/${business.slug}`)
      .then((r) => r.json())
      .then((data) => {
        setDetail(data.business);
      })
      .catch(() => {});
    // Fetch dynamic reviews
    fetch(`/api/reviews?businessSlug=${business.slug}`)
      .then((r) => r.json())
      .then((data) => {
        setDynamicReviews(data.reviews || []);
      })
      .catch(() => {});
    setShowReviewForm(false);
    setNewReviewRating(0);
    setNewReviewComment('');
    setPromoIndex(0);
  }, [business, open]);

  const handleSubmitReview = async () => {
    if (!business || newReviewRating === 0) return;
    submittingReviewSet(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug: business.slug,
          rating: newReviewRating,
          comment: newReviewComment,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDynamicReviews((prev) => [data.review, ...prev]);
        setShowReviewForm(false);
        setNewReviewRating(0);
        setNewReviewComment('');
      }
    } catch {
      // silently fail
    } finally {
      submittingReviewSet(false);
    }
  };

  const isLoading = open && !detail;

  const b = detail || business;
  if (!b) return null;

  const config = CATEGORY_CONFIG[b.category];
  const Icon = config.icon;
  const hasGallery = b.gallery && b.gallery.length > 0;
  const hasMap = b.latitude && b.longitude;
  const googleMapsEmbedUrl = hasMap
    ? `https://www.google.com/maps?q=${b.latitude},${b.longitude}&z=16&output=embed`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar-y p-0 gap-0">
        {/* Header with image or accent */}
        {b.image ? (
          <div className="relative h-48 sm:h-56">
            <Image
              src={b.image}
              alt={b.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 640px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 text-white">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
                    <Icon size={12} />
                    {config.label}
                  </span>
                  {b.verified && (
                    <ShieldCheck size={16} className="text-white/90" />
                  )}
                </div>
                <DialogTitle className="text-xl text-white">{b.name}</DialogTitle>
                <DialogDescription className="text-white/80">
                  {b.subcategory} · {b.zone}
                  {b.address && ` · ${b.address}`}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground rounded-t-xl">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
                  <Icon size={12} />
                  {config.label}
                </span>
                {b.verified && (
                  <ShieldCheck size={16} className="text-white/90" />
                )}
              </div>
              <DialogTitle className="text-xl text-white">{b.name}</DialogTitle>
              <DialogDescription className="text-primary-foreground/70">
                {b.subcategory} · {b.zone}
                {b.address && ` · ${b.address}`}
              </DialogDescription>
            </DialogHeader>
          </div>
        )}

        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Description */}
            {b.description && (
              <p className="text-sm text-foreground/80 leading-relaxed">
                {b.description}
              </p>
            )}

            {/* Rating */}
            <div className="flex items-center gap-3">
              <StarRating rating={b.rating} size={18} />
              <span className="text-sm font-semibold text-foreground">
                {b.rating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({b.reviewCount} reseñas)
              </span>
            </div>

            {/* Reviews */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">
                  Reseñas
                </h4>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  <MessageCircle size={12} />
                  Escribir reseña
                </button>
              </div>

              {/* Review Form */}
              <AnimatePresence>
                {showReviewForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {session ? (
                      <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 space-y-3">
                        <div className="flex items-center gap-2">
                          {session.user?.image ? (
                            <img
                              src={session.user.image}
                              alt=""
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">
                              {(session.user?.name || '?')[0]}
                            </div>
                          )}
                          <span className="text-xs font-medium text-foreground">
                            {session.user?.name}
                          </span>
                        </div>

                        {/* Star selector */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground mr-1">Tu calificación:</span>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setNewReviewRating(star)}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                size={20}
                                className={
                                  star <= newReviewRating
                                    ? 'text-primary fill-primary'
                                    : 'text-border'
                                }
                              />
                            </button>
                          ))}
                        </div>

                        <textarea
                          value={newReviewComment}
                          onChange={(e) => setNewReviewComment(e.target.value)}
                          placeholder="Tu experiencia en este lugar..."
                          rows={2}
                          className="w-full text-xs rounded-xl border border-border bg-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all duration-200"
                        />

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 transition-colors duration-200"
                            onClick={handleSubmitReview}
                            disabled={newReviewRating === 0 || submittingReview}
                          >
                            {submittingReview ? 'Publicando...' : 'Publicar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-8"
                            onClick={() => { setShowReviewForm(false); setNewReviewRating(0); setNewReviewComment(''); }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-muted/50 border border-border/40 p-4 text-center space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Iniciá sesión con Google para dejar tu reseña
                        </p>
                        <button
                          onClick={() => signIn('google')}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted/50 text-sm font-medium text-foreground transition-colors shadow-soft"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Iniciar sesión con Google
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reviews list */}
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar-y">
                {/* Dynamic reviews from DB */}
                {dynamicReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl bg-primary/5 border border-primary/10 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium">Google</span>
                        <span className="text-xs font-medium text-foreground">
                          {review.authorName}
                        </span>
                      </div>
                      <StarRating rating={review.rating} size={11} />
                    </div>
                    {review.comment && (
                      <p className="text-xs text-foreground/70">{review.comment}</p>
                    )}
                  </div>
                ))}
                {/* Static reviews from data */}
                {detail && detail.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl bg-muted/50 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">
                        {review.author || 'Anónimo'}
                      </span>
                      <StarRating rating={review.rating} size={11} />
                    </div>
                    {review.comment && (
                      <p className="text-xs text-foreground/70">{review.comment}</p>
                    )}
                  </div>
                ))}
                {dynamicReviews.length === 0 && (!detail || detail.reviews.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Aún no hay reseñas. ¡Sé el primero!
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Specialty */}
              {b.specialty && (
                <div className="flex items-start gap-2">
                  <Wine size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Especialidad
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.specialty}
                    </p>
                  </div>
                </div>
              )}

              {/* Top Brands */}
              {b.topBrands && (
                <div className="flex items-start gap-2">
                  <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Marcas destacadas
                    </p>
                    <p className="text-xs text-muted-foreground">{b.topBrands}</p>
                  </div>
                </div>
              )}

              {/* Hours */}
              {b.hours && (
                <div className="flex items-start gap-2">
                  <Clock size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Horario</p>
                    <p className="text-xs text-muted-foreground">{b.hours}</p>
                  </div>
                </div>
              )}

              {/* Happy Hour */}
              {b.happyHour && (
                <div className="flex items-start gap-2">
                  <PartyPopper size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Happy Hour
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.happyHour}
                    </p>
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="flex items-start gap-2">
                <Tag size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Rango de precio</p>
                  <PriceRangeIndicator range={b.priceRange} />
                </div>
              </div>

              {/* Phone */}
              {b.phone && (
                <div className="flex items-start gap-2">
                  <Phone size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Teléfono</p>
                    <p className="text-xs text-muted-foreground">{b.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap gap-2">
              {b.hasDelivery && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 text-xs font-medium">
                  <Truck size={13} /> Delivery
                </span>
              )}
              {b.petFriendly && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1 text-xs font-medium">
                  <PawPrint size={13} /> Pet-friendly
                </span>
              )}
              {b.hasReservations && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary border border-primary/15 px-3 py-1 text-xs font-medium">
                  <CalendarCheck size={13} /> Reservas
                </span>
              )}
            </div>

            {/* Tags */}
            {b.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {b.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Promotions — drag carousel on mobile, vertical on desktop */}
            {detail && detail.promotions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">
                    Promociones activas
                  </h4>
                  {detail.promotions.length > 1 && (
                    <span className="text-[10px] text-muted-foreground lg:hidden">Desliza ← →</span>
                  )}
                </div>
                {/* Mobile: debounced CSS carousel, no gesture libs */}
                <div className="lg:hidden">
                  <div className="overflow-hidden rounded-xl">
                    <div
                      className="flex transition-transform duration-300 ease-out"
                      style={{ transform: `translateX(-${promoIndex * 100}%)` }}
                    >
                      {detail.promotions.map((promo) => (
                        <div key={promo.id} className="w-full flex-shrink-0 px-0.5">
                          <button
                            onClick={() => setExpandedPromo(promo)}
                            className="w-full text-left rounded-xl border border-red-500/20 bg-red-500/10 p-3 active:scale-[0.98] transition-transform duration-200"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-red-400 truncate">
                                {promo.title}
                              </span>
                              {promo.discount && (
                                <span className="inline-flex items-center rounded-full bg-red-600 text-white px-2 py-0.5 text-[10px] font-bold flex-shrink-0">
                                  {promo.discount}
                                </span>
                              )}
                            </div>
                            {promo.description && (
                              <p className="text-xs text-red-400/70 line-clamp-2">
                                {promo.description}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1.5">Toca para ver más</p>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Dots indicator */}
                  {detail.promotions.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-2">
                      {detail.promotions.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const now = Date.now();
                            if (now - promoNavTime.current < 300) return;
                            promoNavTime.current = now;
                            setPromoIndex(i);
                          }}
                          className={`h-1.5 rounded-full transition-all duration-200 ${
                            i === promoIndex
                              ? 'bg-red-400 w-4'
                              : 'bg-white/20 w-1.5 hover:bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {/* Desktop: vertical list */}
                <div className="hidden lg:block space-y-2">
                  {detail.promotions.map((promo) => (
                    <button
                      key={promo.id}
                      onClick={() => setExpandedPromo(promo)}
                      className="w-full text-left rounded-xl border border-red-500/20 bg-red-500/10 p-3 hover:bg-red-500/15 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-red-400">
                          {promo.title}
                        </span>
                        {promo.discount && (
                          <span className="inline-flex items-center rounded-full bg-red-600 text-white px-2 py-0.5 text-[10px] font-bold">
                            {promo.discount}
                          </span>
                        )}
                      </div>
                      {promo.description && (
                        <p className="text-xs text-red-400/70">
                          {promo.description}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1.5">Toca para ver más</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Gallery */}
            {hasGallery && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Fotos y promociones
                </h4>
                {/* Mobile & Desktop: grid layout — avoids CSS scroll conflict inside modal overflow-y:auto */}
                <div className="grid grid-cols-3 gap-2">
                  {b.gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setGalleryIndex(i);
                        setShowGallery(true);
                      }}
                      className="relative aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary/50 active:scale-95 transition-all duration-200"
                    >
                      <Image
                        src={img}
                        alt={`${b.name} foto ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="120px"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setGalleryIndex(0);
                    setShowGallery(true);
                  }}
                  className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                >
                  Ver galería completa <ChevronRight size={12} />
                </button>
              </div>
            )}

            {/* Google Maps */}
            {googleMapsEmbedUrl && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin size={14} className="text-primary" />
                  Ubicación
                </h4>
                <div className="rounded-lg overflow-hidden border">
                  <iframe
                    src={googleMapsEmbedUrl}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Ubicación de ${b.name}`}
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              {b.whatsapp && (
                <a
                  href={`https://wa.me/${b.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white transition-colors duration-200">
                    <MessageCircle size={16} />
                    WhatsApp
                  </Button>
                </a>
              )}
              {b.instagram && (
                <a
                  href={`https://instagram.com/${b.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    className="w-full border-pink-200 text-pink-700 hover:bg-pink-50/80 transition-colors duration-200"
                  >
                    <Instagram size={16} />
                    Instagram
                  </Button>
                </a>
              )}
              {b.website && (
                <a
                  href={b.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    className="w-full border-border text-foreground hover:bg-muted transition-colors duration-200"
                  >
                    <Globe size={16} />
                    Página web
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
      </DialogContent>

      {/* Full-screen Gallery Lightbox — debounced nav, no gesture libs */}
      {showGallery && hasGallery && (() => {
        const nav = (idx: number) => {
          const now = Date.now();
          if (now - galleryNavTime.current < 300) return;
          galleryNavTime.current = now;
          setGalleryIndex(idx);
        };
        return (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center select-none"
          style={{ touchAction: 'none' }}
        >
          {/* Close */}
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 active:scale-90 transition-all backdrop-blur-sm"
          >
            <X size={24} />
          </button>
          {/* Prev */}
          <button
            onClick={() => nav((galleryIndex - 1 + b.gallery.length) % b.gallery.length)}
            className="absolute left-2 sm:left-6 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 active:scale-90 transition-all backdrop-blur-sm"
          >
            <ChevronLeft size={28} />
          </button>
          {/* Next */}
          <button
            onClick={() => nav((galleryIndex + 1) % b.gallery.length)}
            className="absolute right-2 sm:right-6 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 active:scale-90 transition-all backdrop-blur-sm"
          >
            <ChevronRight size={28} />
          </button>
          {/* Image area — no event handlers, just display */}
          <div className="w-full h-full flex items-center justify-center p-16 sm:p-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={galleryIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative w-full h-full"
              >
                <Image
                  src={b.gallery[galleryIndex]}
                  alt={`${b.name} foto ${galleryIndex + 1}`}
                  fill
                  className="object-contain pointer-events-none"
                  sizes="100vw"
                  draggable={false}
                  priority={galleryIndex === 0}
                />
              </motion.div>
            </AnimatePresence>
          </div>
          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {b.gallery.map((_, i) => (
              <button
                key={i}
                onClick={() => nav(i)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  i === galleryIndex ? 'bg-primary scale-125' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
          {/* Counter */}
          <div className="absolute bottom-6 right-6 rounded-full bg-black/50 text-white px-3 py-1.5 text-sm font-medium backdrop-blur-sm z-20">
            {galleryIndex + 1} / {b.gallery.length}
          </div>
        </div>
        );
      })()}

      {/* Expanded Promotion Modal */}
      <Dialog open={!!expandedPromo} onOpenChange={(o) => { if (!o) setExpandedPromo(null); }}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-y-auto max-h-[85vh]" showCloseButton={false}>
          {/* Custom close button — large touch target for mobile */}
          <button
            onClick={() => setExpandedPromo(null)}
            className="absolute top-3 right-3 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 active:scale-90 transition-all duration-150 backdrop-blur-sm"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
          <div className="bg-gradient-to-r from-red-600 to-red-500 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white/70 font-medium uppercase tracking-wide">Promoción activa</p>
                <h3 className="text-lg font-bold text-white mt-0.5 truncate">
                  {expandedPromo?.title}
                </h3>
              </div>
              {expandedPromo?.discount && (
                <div className="flex-shrink-0 rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2">
                  <span className="text-xl font-extrabold text-white">{expandedPromo.discount}</span>
                </div>
              )}
            </div>
          </div>
          <div className="p-6 space-y-4">
            {b.image && (
              <div className="rounded-xl overflow-hidden border border-border/40">
                <Image
                  src={b.image}
                  alt={b.name}
                  width={600}
                  height={300}
                  className="w-full h-40 object-cover"
                />
              </div>
            )}
            {expandedPromo?.description && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1.5">Detalles de la promoción</h4>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {expandedPromo.description}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Store size={14} className="text-primary" />
              <span className="font-medium text-foreground">{b.name}</span>
              <span>·</span>
              <span>{b.zone}</span>
            </div>
            {b.whatsapp && (
              <a
                href={`https://wa.me/${b.whatsapp}?text=Hola, estoy interesado/a en la promoción: ${encodeURIComponent(expandedPromo?.title ?? '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 mt-2">
                  <MessageCircle size={16} />
                  Preguntar por WhatsApp
                </Button>
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'ALL'>(
    'ALL'
  );
  const [activeZone, setActiveZone] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [ageDismissed, setAgeDismissed] = useState(false);

  // Verificar edad via cookie del servidor (no puede ser manipulada por el cliente)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/age-verify');
        const data = await res.json();
        if (data.verified) setAgeVerified(true);
      } catch {
        // fallback: si falla el check, mostramos el gate
      }
    })();
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== 'ALL') params.set('category', activeCategory);
    if (activeZone !== 'Todas') params.set('zone', activeZone);
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

    try {
      const res = await fetch(`/api/businesses?${params.toString()}`);
      const data = await res.json();
      setBusinesses(data.businesses);
      setStats(data.stats);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeZone, debouncedSearch]);

  // Solo fetchear datos si la edad fue verificada
  useEffect(() => {
    if (ageVerified) fetchData();
  }, [ageVerified, fetchData]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  const handleBusinessSelect = (b: Business) => {
    setSelectedBusiness(b);
    setModalOpen(true);
  };

  const allPromotions = businesses.filter((b) => b.promotions.length > 0);
  const featuredBusinesses = businesses.filter((b) => b.featured);

  const handleAgeVerify = async (isAdult: boolean) => {
    if (isAdult) {
      try {
        await fetch('/api/age-verify', { method: 'POST' });
      } catch {
        // Si falla el server, igual dejamos pasar (cookie no esencial para UX)
      }
      setAgeVerified(true);
    } else {
      setAgeDismissed(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── AGE VERIFICATION OVERLAY ─── */}
      <AnimatePresence>
        {!ageVerified && !ageDismissed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-border/30"
            >
              {/* Top gradient bar */}
              <div className="h-1.5 bg-gradient-to-r from-primary via-amber-500 to-primary/80" />
              
              <div className="p-10 text-center">
                {/* Icon */}
                <img src="/logo.png" alt="Conecta-Lt" className="mx-auto w-20 h-20 rounded-2xl object-contain mb-6 shadow-soft" />
                
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Verificación de edad
                </h2>
                <p className="text-muted-foreground mb-2 text-sm">
                  Este sitio contiene información sobre bebidas alcohólicas.
                </p>
                <p className="text-foreground font-semibold mb-8">
                  ¿Confirmás que sos mayor de 18 años?
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleAgeVerify(true)}
                    className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base transition-all duration-200 active:scale-[0.98] shadow-lg shadow-primary/25"
                  >
                    Sí, soy mayor de edad
                  </button>
                  <button
                    onClick={() => handleAgeVerify(false)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground font-medium text-base transition-all duration-200 active:scale-[0.98]"
                  >
                    No, soy menor de edad
                  </button>
                </div>

                <p className="text-[11px] text-muted-foreground mt-8">
                  Beber con moderación. Prohibida la venta de alcohol a menores de edad.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MINOR BLOCKED SCREEN ─── */}
      {ageDismissed && !ageVerified && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-sm">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <X size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Acceso restringido
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Lo sentimos, debés ser mayor de 18 años para acceder a este contenido.
            </p>
            <button
              onClick={() => setAgeDismissed(false)}
              className="text-primary hover:text-primary/80 font-medium text-sm underline transition-colors underline-offset-4"
            >
              Volver a verificar
            </button>
          </div>
        </div>
      )}

      {/* ─── HEADER / NAVBAR (sticky) ─── */}
      <header className="sticky top-0 z-40 glass border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Conecta-Lt" className="w-9 h-9 rounded-xl object-contain" />
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight tracking-tight">
                  Conecta-Lt
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight hidden sm:block">
                  Directorio de licores, tascas y bodegones en Los Teques
                </p>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              {(
                Object.entries(CATEGORY_CONFIG) as [CategoryKey, (typeof CATEGORY_CONFIG)[CategoryKey]][]
              ).map(([key, cfg]) => {
                const NavIcon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() =>
                      setActiveCategory(activeCategory === key ? 'ALL' : key)
                    }
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeCategory === key
                        ? cfg.activeColor
                        : 'text-muted-foreground hover:bg-muted/60'
                    }`}
                  >
                    <NavIcon size={14} className="sm:hidden" />
                    <span className="hidden sm:inline">{cfg.label}</span>
                  </button>
                );
              })}
              {stats && stats.promotions > 0 && (
                <button
                  onClick={() => {
                    setActiveCategory('ALL');
                    setActiveZone('Todas');
                    setSearchQuery('');
                  }}
                  className="relative inline-flex items-center gap-1 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
                >
                  <PartyPopper size={14} />
                  <span className="hidden sm:inline">Promociones</span>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {stats.promotions}
                  </span>
                </button>
              )}

              {/* User login button */}
              {session ? (
                <div className="flex items-center gap-2 ml-1">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-7 h-7 rounded-full border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold border-2 border-primary/20">
                      {(session.user?.name || '?')[0]}
                    </div>
                  )}
                  <button
                    onClick={() => window.location.href = '/admin'}
                    className="hidden sm:inline-flex text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="hidden sm:inline-flex text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors ml-1"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="hidden sm:inline">Ingresar</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── HERO SECTION ─── */}
        <section className="relative overflow-hidden py-16 sm:py-24 hero-gradient">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-[2.85rem] font-extrabold text-foreground mb-3 leading-[1.15] tracking-tight text-balance">
              Descubre los mejores licores de{' '}
              <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">Los Teques</span>
            </h2>
            <p className="text-sm sm:text-[15px] text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed">
              Licorerías, tascas y bodegones. Encuentra tu lugar favorito para disfrutar.
            </p>

            {/* Search bar */}
            <div className="flex items-center gap-2.5 max-w-xl mx-auto mb-10">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Buscar por nombre, marca, especialidad..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-card/90 backdrop-blur-sm border-border/60 text-sm shadow-card focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                />
              </div>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 rounded-xl font-medium shadow-md shadow-primary/25 transition-colors duration-200"
                onClick={fetchData}
              >
                <Search size={16} />
                <span className="hidden sm:inline ml-1">Buscar</span>
              </Button>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
              <button
                onClick={() => setActiveCategory('ALL')}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeCategory === 'ALL'
                    ? 'bg-foreground text-background shadow-md shadow-foreground/15 hover:bg-foreground/90'
                    : 'bg-card/90 text-muted-foreground border border-border/60 hover:bg-card hover:shadow-soft'
                }`}
              >
                <span className="text-base">🍽️</span> Todos
              </button>
              {(
                Object.entries(CATEGORY_CONFIG) as [CategoryKey, (typeof CATEGORY_CONFIG)[CategoryKey]][]
              ).map(([key, cfg]) => {
                const CatIcon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                      activeCategory === key
                        ? cfg.activeColor + ' shadow-md'
                        : 'bg-card/90 text-muted-foreground border border-border/60 hover:bg-card hover:shadow-soft'
                    }`}
                  >
                    <CatIcon size={16} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Stat badges */}
            {stats && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 border border-border/50 px-4 py-2 text-xs font-medium text-muted-foreground shadow-soft">
                  <Store size={13} className="text-primary" />
                  <span className="font-semibold text-foreground">{stats.total}</span> negocios
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 border border-border/50 px-4 py-2 text-xs font-medium text-muted-foreground shadow-soft">
                  <ShieldCheck size={13} className="text-primary" />
                  <span className="font-semibold text-foreground">{stats.verified}</span> verificados
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 border border-border/50 px-4 py-2 text-xs font-medium text-muted-foreground shadow-soft">
                  <PartyPopper size={13} className="text-red-500" />
                  <span className="font-semibold text-foreground">{stats.promotions}</span> promos activas
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 border border-border/50 px-4 py-2 text-xs font-medium text-muted-foreground shadow-soft">
                  <MapPin size={13} className="text-primary" />
                  <span className="font-semibold text-foreground">{stats.zones.length}</span> zonas
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ─── ZONE FILTER BAR ─── */}
        <section className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-14 sm:top-16 z-30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="swipe-x flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
              {ZONES.map((zone) => (
                <button
                  key={zone}
                  onClick={() => setActiveZone(zone)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeZone === zone
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {zone === 'Todas' ? (
                    <MapPin size={12} />
                  ) : (
                    <MapPin size={12} />
                  )}
                  {zone}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURED BUSINESSES ─── */}
        {featuredBusinesses.length > 0 && !loading && (
          <section className="py-8 sm:py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                  Destacados en Los Teques
                </h3>
              </div>
              <div className="swipe-x flex gap-5 overflow-x-auto no-scrollbar pb-2">
                {featuredBusinesses.map((b) => (
                  <FeaturedCard
                    key={b.id}
                    business={b}
                    onSelect={handleBusinessSelect}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── MAIN CONTENT: Grid + Sidebar ─── */}
        <section className="py-8 sm:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                  Todos los establecimientos
                </h3>
                {!loading && (
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-bold">
                    {businesses.length}
                  </span>
                )}
              </div>
              {/* Active filter indicator */}
              {(activeCategory !== 'ALL' || activeZone !== 'Todas' || searchQuery) && (
                <button
                  onClick={() => {
                    setActiveCategory('ALL');
                    setActiveZone('Todas');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={12} />
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Business Grid */}
              <div className="flex-1">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <BusinessCardSkeleton key={i} />
                    ))}
                  </div>
                ) : businesses.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <Search size={28} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      No se encontraron establecimientos
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Intenta con otros filtros o términos de búsqueda
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {businesses.map((b) => (
                      <BusinessCard
                        key={b.id}
                        business={b}
                        onSelect={handleBusinessSelect}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Promotions Sidebar (desktop) */}
              {allPromotions.length > 0 && (
                <aside className="hidden lg:block w-80 flex-shrink-0">
                  <div className="sticky top-36">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10">
                          <PartyPopper size={14} className="text-red-400" />
                        </div>
                        <h4 className="text-sm font-bold text-foreground">
                          Promociones activas
                        </h4>
                      </div>
                    </div>
                    <div className="relative">
                      <div
                        id="sidebar-promos"
                        className="swipe-x no-scrollbar flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1"
                      >
                        {allPromotions.map((b) => (
                          <div key={b.id} className="min-w-[260px] max-w-[260px] snap-start">
                            <PromotionCard business={b} onSelect={handleBusinessSelect} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </aside>
              )}
            </div>

            {/* Promotions Section (mobile) */}
            {allPromotions.length > 0 && (
              <div className="mt-10 lg:hidden">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10">
                    <PartyPopper size={14} className="text-red-400" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Promociones activas
                  </h4>
                </div>
                <div
                  className="swipe-x no-scrollbar flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-4 px-4"
                >
                  {allPromotions.map((b) => (
                    <div key={b.id} className="min-w-[280px] max-w-[85vw] snap-start">
                      <PromotionCard business={b} onSelect={handleBusinessSelect} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="mt-auto border-t border-border/40 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Conecta-Lt" className="w-7 h-7 rounded-lg object-contain" />
              <p className="text-xs text-foreground/80">
                Conecta-Lt — Directorio hiperlocalizado de Los Teques, Estado Miranda
              </p>
            </div>
            <div className="flex items-center gap-4">
              {(
                Object.entries(CATEGORY_CONFIG) as [CategoryKey, (typeof CATEGORY_CONFIG)[CategoryKey]][]
              ).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveCategory(key);
                    setActiveZone('Todas');
                    setSearchQuery('');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {cfg.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setActiveCategory('ALL');
                  setActiveZone('Todas');
                  setSearchQuery('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Promociones
              </button>
            </div>
          </div>
          <div className="text-center mt-6 pt-6 border-t border-border/30">
            <p className="text-[11px] text-muted-foreground">
              Hecho con amor desde Los Teques 🇻🇪
            </p>
          </div>
        </div>
      </footer>

      {/* ─── DETAIL MODAL ─── */}
      <DetailModal
        key={selectedBusiness?.slug ?? 'none'}
        business={selectedBusiness}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}