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
              : 'text-gray-300'
          }
        />
      ))}
    </div>
  );
}

function PriceRangeIndicator({ range }: { range: string }) {
  const level = range.length;
  return (
    <span className="text-xs font-medium text-muted-foreground">
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className={i < level ? 'text-amber-600 font-bold' : 'text-gray-300'}
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
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="h-8 w-full mt-2" />
    </div>
  );
}

function FeaturedCardSkeleton() {
  return (
    <div className="min-w-[280px] max-w-[320px] flex-shrink-0 rounded-xl border p-4 space-y-3">
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: '0 8px 25px -5px rgba(0,0,0,0.1)' }}
      className="rounded-xl border bg-white flex flex-col transition-colors cursor-default overflow-hidden"
    >
      {/* Business image or gradient placeholder */}
      <div className="relative h-36 w-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
        {business.image ? (
          <Image
            src={business.image}
            alt={business.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <Icon size={40} className="text-amber-300" />
        )}
        {/* Category badge overlay */}
        <div className="absolute top-2 left-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border backdrop-blur-sm bg-white/80 ${config.color}`}
          >
            <Icon size={12} />
            {config.label}
          </span>
        </div>
        {hasActivePromo && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 text-white px-2 py-0.5 text-xs font-bold shadow-sm">
              <Tag size={10} />
              {business.promotions[0].discount}
            </span>
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Name */}
      <div>
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-sm text-gray-900 leading-tight">
            {business.name}
          </h3>
          {business.verified && (
            <ShieldCheck size={14} className="text-amber-600 flex-shrink-0" />
          )}
        </div>
        {business.subcategory && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {business.subcategory}
          </p>
        )}
      </div>

      {/* Zone + Rating row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin size={12} />
          {business.zone}
        </div>
        <div className="flex items-center gap-1.5">
          <StarRating rating={business.rating} size={12} />
          <span className="text-xs text-muted-foreground">
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
              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
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
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
            <Truck size={11} /> Delivery
          </span>
        )}
        {business.petFriendly && (
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
            <PawPrint size={11} /> Pet-friendly
          </span>
        )}
        {business.hasReservations && (
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
            <CalendarCheck size={11} /> Reservas
          </span>
        )}
      </div>

      {/* CTA */}
      <Button
        variant="outline"
        size="sm"
        className="mt-auto w-full text-amber-700 border-amber-200 hover:bg-amber-50 hover:text-amber-800"
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
      whileHover={{ y: -4, boxShadow: '0 8px 25px -5px rgba(0,0,0,0.1)' }}
      className="min-w-[280px] max-w-[320px] flex-shrink-0 snap-start rounded-xl border bg-white overflow-hidden transition-colors"
    >
      {/* Image or placeholder */}
      <div className="relative h-32 w-full bg-gradient-to-br from-amber-100 to-amber-50">
        {business.image ? (
          <Image
            src={business.image}
            alt={business.name}
            fill
            className="object-cover"
            sizes="320px"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Icon size={36} className="text-amber-300" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border backdrop-blur-sm bg-white/80 ${config.color}`}
          >
            <Icon size={12} />
            {config.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm">
            <Sparkles size={10} /> Destacado
          </span>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3">
      <div>
        <h3 className="font-bold text-sm text-gray-900">{business.name}</h3>
        {business.subcategory && (
          <p className="text-xs text-muted-foreground">{business.subcategory}</p>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin size={12} />
        {business.zone}
      </div>
      <div className="flex items-center gap-2">
        <StarRating rating={business.rating} size={13} />
        <span className="text-xs text-muted-foreground">
          ({business.reviewCount})
        </span>
      </div>
      <Button
        size="sm"
        className="w-full bg-amber-600 text-white hover:bg-amber-700"
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

function PromotionCard({ business }: { business: Business }) {
  return (
    <div className="rounded-lg border bg-white p-3 flex flex-col gap-1.5">
      {business.promotions.map((promo) => (
        <div key={promo.id} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {business.name}
            </p>
            {promo.discount && (
              <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold flex-shrink-0">
                {promo.discount}
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-amber-700">{promo.title}</p>
          {promo.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2">
              {promo.description}
            </p>
          )}
        </div>
      ))}
    </div>
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
  const [detail, setDetail] = useState<Business | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    if (!business || !open) return;
    fetch(`/api/businesses/${business.slug}`)
      .then((r) => r.json())
      .then((data) => {
        setDetail(data.business);
      })
      .catch(() => {});
  }, [business, open]);

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
        {b.image && !showGallery ? (
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
        ) : showGallery && hasGallery ? (
          <div className="relative h-48 sm:h-56 bg-black">
            <AnimatePresence mode="wait">
              <motion.div
                key={galleryIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative h-full w-full"
              >
                <Image
                  src={b.gallery[galleryIndex]}
                  alt={`${b.name} promo ${galleryIndex + 1}`}
                  fill
                  className="object-contain bg-black"
                  sizes="(max-width: 640px) 100vw, 640px"
                />
              </motion.div>
            </AnimatePresence>
            {/* Gallery controls */}
            <button
              onClick={() => setGalleryIndex(Math.max(0, galleryIndex - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white p-1.5 hover:bg-black/70 transition-colors"
              disabled={galleryIndex === 0}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setGalleryIndex(Math.min(b.gallery.length - 1, galleryIndex + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white p-1.5 hover:bg-black/70 transition-colors"
              disabled={galleryIndex === b.gallery.length - 1}
            >
              <ChevronRight size={18} />
            </button>
            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {b.gallery.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setGalleryIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === galleryIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
            {/* Close gallery */}
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-3 right-3 rounded-full bg-black/50 text-white p-1.5 hover:bg-black/70 transition-colors"
            >
              <X size={16} />
            </button>
            {/* Counter */}
            <div className="absolute top-3 left-3 rounded-full bg-black/50 text-white px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
              {galleryIndex + 1} / {b.gallery.length}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-6 text-white rounded-t-xl">
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
              <DialogDescription className="text-amber-100">
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
              <p className="text-sm text-gray-700 leading-relaxed">
                {b.description}
              </p>
            )}

            {/* Rating */}
            <div className="flex items-center gap-3">
              <StarRating rating={b.rating} size={18} />
              <span className="text-sm font-semibold text-gray-900">
                {b.rating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({b.reviewCount} reseñas)
              </span>
            </div>

            {/* Reviews */}
            {detail && detail.reviews.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">
                  Reseñas
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar-y">
                  {detail.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-lg bg-gray-50 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">
                          {review.author || 'Anónimo'}
                        </span>
                        <StarRating rating={review.rating} size={11} />
                      </div>
                      {review.comment && (
                        <p className="text-xs text-gray-600">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Specialty */}
              {b.specialty && (
                <div className="flex items-start gap-2">
                  <Wine size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
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
                  <Sparkles size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      Marcas destacadas
                    </p>
                    <p className="text-xs text-muted-foreground">{b.topBrands}</p>
                  </div>
                </div>
              )}

              {/* Hours */}
              {b.hours && (
                <div className="flex items-start gap-2">
                  <Clock size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Horario</p>
                    <p className="text-xs text-muted-foreground">{b.hours}</p>
                  </div>
                </div>
              )}

              {/* Happy Hour */}
              {b.happyHour && (
                <div className="flex items-start gap-2">
                  <PartyPopper size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
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
                <Tag size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">Rango de precio</p>
                  <PriceRangeIndicator range={b.priceRange} />
                </div>
              </div>

              {/* Phone */}
              {b.phone && (
                <div className="flex items-start gap-2">
                  <Phone size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Teléfono</p>
                    <p className="text-xs text-muted-foreground">{b.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap gap-2">
              {b.hasDelivery && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
                  <Truck size={13} /> Delivery
                </span>
              )}
              {b.petFriendly && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs font-medium">
                  <PawPrint size={13} /> Pet-friendly
                </span>
              )}
              {b.hasReservations && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium">
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
                    className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Promotions */}
            {detail && detail.promotions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">
                  Promociones activas
                </h4>
                {detail.promotions.map((promo) => (
                  <div
                    key={promo.id}
                    className="rounded-lg border border-red-200 bg-red-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-red-700">
                        {promo.title}
                      </span>
                      {promo.discount && (
                        <span className="inline-flex items-center rounded-full bg-red-600 text-white px-2 py-0.5 text-[10px] font-bold">
                          {promo.discount}
                        </span>
                      )}
                    </div>
                    {promo.description && (
                      <p className="text-xs text-red-600/80">
                        {promo.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Photo Gallery */}
            {hasGallery && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">
                  Fotos y promociones
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {b.gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setGalleryIndex(i);
                        setShowGallery(true);
                      }}
                      className="relative aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-amber-400 transition-all"
                    >
                      <Image
                        src={img}
                        alt={`${b.name} foto ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="150px"
                      />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setGalleryIndex(0);
                    setShowGallery(true);
                  }}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                >
                  Ver galería completa <ChevronRight size={12} />
                </button>
              </div>
            )}

            {/* Google Maps */}
            {googleMapsEmbedUrl && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <MapPin size={14} className="text-amber-600" />
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
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
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
                    className="w-full border-pink-300 text-pink-700 hover:bg-pink-50"
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
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
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
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Home() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'ALL'>(
    'ALL'
  );
  const [activeZone, setActiveZone] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [ageDismissed, setAgeDismissed] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('conecta-lt-age-verified');
    if (verified === 'true') setAgeVerified(true);
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== 'ALL') params.set('category', activeCategory);
    if (activeZone !== 'Todas') params.set('zone', activeZone);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());

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
  }, [activeCategory, activeZone, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // fetchData will re-trigger via the searchQuery dep
    }, 300);
  };

  const handleBusinessSelect = (b: Business) => {
    setSelectedBusiness(b);
    setModalOpen(true);
  };

  const allPromotions = businesses.filter((b) => b.promotions.length > 0);
  const featuredBusinesses = businesses.filter((b) => b.featured);

  const handleAgeVerify = (isAdult: boolean) => {
    if (isAdult) {
      localStorage.setItem('conecta-lt-age-verified', 'true');
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
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Top gradient bar */}
              <div className="h-2 bg-gradient-to-r from-amber-500 via-red-500 to-amber-600" />
              
              <div className="p-8 text-center">
                {/* Icon */}
                <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
                  <Wine size={40} className="text-amber-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Verificación de edad
                </h2>
                <p className="text-gray-600 mb-2 text-sm">
                  Este sitio contiene información sobre bebidas alcohólicas.
                </p>
                <p className="text-gray-800 font-semibold mb-8">
                  ¿Confirmás que sos mayor de 18 años?
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleAgeVerify(true)}
                    className="w-full py-3.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-base transition-all active:scale-[0.98] shadow-lg shadow-amber-600/30"
                  >
                    Sí, soy mayor de edad
                  </button>
                  <button
                    onClick={() => handleAgeVerify(false)}
                    className="w-full py-3.5 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-base transition-all active:scale-[0.98]"
                  >
                    No, soy menor de edad
                  </button>
                </div>

                <p className="text-[11px] text-gray-400 mt-6">
                  Beber con moderación. Prohibida la venta de alcohol a menores de edad.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MINOR BLOCKED SCREEN ─── */}
      {ageDismissed && !ageVerified && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center max-w-sm">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <X size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Acceso restringido
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Lo sentimos, debés ser mayor de 18 años para acceder a este contenido.
            </p>
            <button
              onClick={() => setAgeDismissed(false)}
              className="text-amber-600 hover:text-amber-700 font-medium text-sm underline underline-offset-4"
            >
              Volver a verificar
            </button>
          </div>
        </div>
      )}

      {/* ─── HEADER / NAVBAR (sticky) ─── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-600 text-white">
                <Wine size={18} />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
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
                        : 'text-gray-600 hover:bg-gray-100'
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
                  className="relative inline-flex items-center gap-1 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <PartyPopper size={14} />
                  <span className="hidden sm:inline">Promociones</span>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {stats.promotions}
                  </span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── HERO SECTION ─── */}
        <section className="bg-gradient-to-b from-amber-50 to-white py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">
              Descubre los mejores licores de{' '}
              <span className="text-amber-600">Los Teques</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-xl mx-auto">
              Licorerías, tascas y bodegones. Encuentra tu lugar favorito.
            </p>

            {/* Search bar */}
            <div className="flex items-center gap-2 max-w-lg mx-auto mb-6">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Buscar por nombre, marca, especialidad..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 h-11"
                />
              </div>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white h-11 px-5"
                onClick={fetchData}
              >
                <Search size={16} />
                <span className="hidden sm:inline ml-1">Buscar</span>
              </Button>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <button
                onClick={() => setActiveCategory('ALL')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === 'ALL'
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-white text-gray-600 border hover:bg-gray-50'
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
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      activeCategory === key
                        ? cfg.activeColor
                        : 'bg-white text-gray-600 border hover:bg-gray-50'
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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white border px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
                  <Store size={13} className="text-amber-600" />
                  {stats.total} negocios
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white border px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
                  <ShieldCheck size={13} className="text-amber-600" />
                  {stats.verified} verificados
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white border px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
                  <PartyPopper size={13} className="text-red-500" />
                  {stats.promotions} promociones activas
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white border px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
                  <MapPin size={13} className="text-amber-600" />
                  {stats.zones.length} zonas
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ─── ZONE FILTER BAR ─── */}
        <section className="border-b bg-white sticky top-14 sm:top-16 z-30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
              {ZONES.map((zone) => (
                <button
                  key={zone}
                  onClick={() => setActiveZone(zone)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeZone === zone
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          <section className="py-6 sm:py-8 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-amber-600" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  Destacados en Los Teques
                </h3>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
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
        <section className="py-6 sm:py-8 bg-gray-50/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  Todos los establecimientos
                </h3>
                {!loading && (
                  <span className="inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-bold">
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

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Business Grid */}
              <div className="flex-1">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <BusinessCardSkeleton key={i} />
                    ))}
                  </div>
                ) : businesses.length === 0 ? (
                  <div className="text-center py-16">
                    <Search size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-500">
                      No se encontraron establecimientos
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Intenta con otros filtros o términos de búsqueda
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
                    <div className="flex items-center gap-2 mb-3">
                      <PartyPopper size={16} className="text-red-500" />
                      <h4 className="text-sm font-bold text-gray-900">
                        Promociones activas
                      </h4>
                    </div>
                    <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar-y pr-1">
                      {allPromotions.map((b) => (
                        <PromotionCard key={b.id} business={b} />
                      ))}
                    </div>
                  </div>
                </aside>
              )}
            </div>

            {/* Promotions Section (mobile) */}
            {allPromotions.length > 0 && (
              <div className="mt-8 lg:hidden">
                <div className="flex items-center gap-2 mb-3">
                  <PartyPopper size={16} className="text-red-500" />
                  <h4 className="text-sm font-bold text-gray-900">
                    Promociones activas
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allPromotions.map((b) => (
                    <PromotionCard key={b.id} business={b} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="mt-auto border-t bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-600 text-white">
                <Wine size={13} />
              </div>
              <span className="text-xs text-muted-foreground">
                Conecta-Lt — Directorio hiperlocalizado de Los Teques, Estado
                Miranda
              </span>
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
                  className="text-xs text-muted-foreground hover:text-amber-600 transition-colors"
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
                className="text-xs text-muted-foreground hover:text-amber-600 transition-colors"
              >
                Promociones
              </button>
            </div>
          </div>
          <div className="text-center mt-4 pt-4 border-t">
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