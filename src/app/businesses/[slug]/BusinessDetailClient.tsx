'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Star, MapPin, Phone, Clock, Truck, PawPrint,
  CalendarCheck, Tag, ArrowLeft, ExternalLink,
  MessageCircle, ChevronLeft, ChevronRight, X, Share2,
  Wine, Beer, ShoppingBag, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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
  businessId: string;
  author: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface BusinessData {
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
}

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  LICORERIA: { label: 'Licorería', icon: <Wine size={18} />, color: 'text-amber-700', bg: 'bg-amber-50' },
  TASCA: { label: 'Tasca', icon: <Beer size={18} />, color: 'text-orange-700', bg: 'bg-orange-50' },
  BODEGON: { label: 'Bodegón', icon: <ShoppingBag size={18} />, color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

const priceLabels: Record<string, { label: string; range: string }> = {
  '$': { label: 'Económico', range: '$' },
  '$$': { label: 'Moderado', range: '$$' },
  '$$$': { label: 'Premium', range: '$$$' },
};

export default function BusinessDetailClient({
  business,
  reviews,
}: {
  business: BusinessData;
  reviews: Review[];
}) {
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const cat = categoryConfig[business.category] ?? categoryConfig.LICORERIA;
  const price = priceLabels[business.priceRange] ?? { label: '', range: business.priceRange };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: business.name, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con imagen de fondo */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-amber-600 to-amber-800">
        {business.image && (
          <img
            src={business.image}
            alt={business.name}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end p-6 max-w-4xl mx-auto w-full">
          <Link href="/" className="inline-flex items-center text-white/80 hover:text-white mb-4 text-sm transition-colors">
            <ArrowLeft size={16} className="mr-1" /> Volver al directorio
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`${cat.bg} ${cat.color} border-0 text-xs font-medium`}>
              {cat.icon} {cat.label}
            </Badge>
            {business.verified && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0 text-xs">
                <CheckCircle2 size={12} className="mr-1" /> Verificado
              </Badge>
            )}
            {business.featured && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0 text-xs">
                <Star size={12} className="mr-1" /> Destacado
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{business.name}</h1>
          <div className="flex items-center gap-3 text-white/90 text-sm">
            <span className="flex items-center gap-1"><MapPin size={14} /> {business.zone}</span>
            <span className="flex items-center gap-1"><Star size={14} className="text-amber-400 fill-amber-400" /> {business.rating} ({business.reviewCount})</span>
            <span>{price.range} {price.label}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {business.address && (
            <Card><CardContent className="p-4 flex items-center gap-3"><MapPin size={20} className="text-amber-600 shrink-0" /><div><p className="text-xs text-gray-500">Dirección</p><p className="text-sm font-medium">{business.address}</p></div></CardContent></Card>
          )}
          {business.phone && (
            <Card><CardContent className="p-4 flex items-center gap-3"><Phone size={20} className="text-amber-600 shrink-0" /><div><p className="text-xs text-gray-500">Teléfono</p><p className="text-sm font-medium">{business.phone}</p></div></CardContent></Card>
          )}
          {business.hours && (
            <Card><CardContent className="p-4 flex items-center gap-3"><Clock size={20} className="text-amber-600 shrink-0" /><div><p className="text-xs text-gray-500">Horario</p><p className="text-sm font-medium">{business.hours}</p></div></CardContent></Card>
          )}
          {business.happyHour && (
            <Card><CardContent className="p-4 flex items-center gap-3"><Tag size={20} className="text-amber-600 shrink-0" /><div><p className="text-xs text-gray-500">Happy Hour</p><p className="text-sm font-medium">{business.happyHour}</p></div></CardContent></Card>
          )}
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap gap-2">
          {business.hasDelivery && <Badge variant="outline" className="gap-1"><Truck size={14} /> Delivery</Badge>}
          {business.petFriendly && <Badge variant="outline" className="gap-1"><PawPrint size={14} /> Pet Friendly</Badge>}
          {business.hasReservations && <Badge variant="outline" className="gap-1"><CalendarCheck size={14} /> Reservas</Badge>}
          {business.subcategory && <Badge variant="outline" className="gap-1">{business.subcategory}</Badge>}
          {(business.tags ?? []).map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
        </div>

        {/* Descripción */}
        {business.description && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Sobre {business.name}</h2>
                <p className="text-gray-600 leading-relaxed">{business.description}</p>
                {business.specialty && (
                  <p className="mt-3 text-sm"><span className="font-medium text-gray-800">Especialidad:</span> <span className="text-amber-700">{business.specialty}</span></p>
                )}
                {business.topBrands && (
                  <p className="mt-1 text-sm"><span className="font-medium text-gray-800">Marcas destacadas:</span> <span className="text-gray-600">{business.topBrands}</span></p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Galería */}
        {business.gallery && business.gallery.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Galería</h2>
            <div className="grid grid-cols-3 gap-2">
              {business.gallery.slice(0, 3).map((img, i) => (
                <button key={i} onClick={() => { setGalleryIdx(i); setGalleryOpen(true); }} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer">
                  <img src={img} alt={`${business.name} foto ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {i === 2 && business.gallery.length > 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold">+{business.gallery.length - 3}</div>
                  )}
                </button>
              ))}
            </div>

            {/* Lightbox */}
            {galleryOpen && (
              <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
                <button onClick={() => setGalleryOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={28} /></button>
                <button onClick={() => setGalleryIdx((p) => (p - 1 + business.gallery.length) % business.gallery.length)} className="absolute left-4 text-white/70 hover:text-white"><ChevronLeft size={36} /></button>
                <button onClick={() => setGalleryIdx((p) => (p + 1) % business.gallery.length)} className="absolute right-4 text-white/70 hover:text-white"><ChevronRight size={36} /></button>
                <img src={business.gallery[galleryIdx]} alt={`${business.name} foto ${galleryIdx + 1}`} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
                <p className="absolute bottom-6 text-white/60 text-sm">{galleryIdx + 1} / {business.gallery.length}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Promociones */}
        {(business as unknown as { promotions?: Promotion[] }).promotions && (business as unknown as { promotions: Promotion[] }).promotions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Promociones activas</h2>
            <div className="grid gap-3">
              {(business as unknown as { promotions: Promotion[] }).promotions.map((promo) => (
                <Card key={promo.id} className="border-amber-200 bg-amber-50/50">
                  <CardContent className="p-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{promo.title}</h3>
                      {promo.description && <p className="text-sm text-gray-600 mt-1">{promo.description}</p>}
                    </div>
                    {promo.discount && <Badge className="bg-amber-600 text-white border-0 shrink-0">{promo.discount}</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Reviews */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Reseñas ({reviews.length})</h2>
          {reviews.length > 0 ? (
            <div className="grid gap-3">
              {reviews.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm">
                          {r.author?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{r.author ?? 'Anónimo'}</p>
                          <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('es-VE')}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />)}</div>
                    </div>
                    {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Aún no hay reseñas. ¡Sé el primero en dejar la tuya!</p>
          )}
        </motion.div>

        {/* Mapa */}
        {business.latitude && business.longitude && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Ubicación</h2>
            <div className="rounded-xl overflow-hidden border">
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${business.longitude}!3d${business.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${business.latitude},${business.longitude}!5e0!3m2!1ses!2sve!4v1`}
                width="100%" height="300" style={{ border: 0 }} allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade" className="w-full"
              />
            </div>
          </motion.div>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap gap-3 pb-8">
          {business.whatsapp && (
            <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noopener noreferrer">
              <Button className="bg-green-600 hover:bg-green-700 text-white gap-2"><MessageCircle size={18} /> WhatsApp</Button>
            </a>
          )}
          {business.instagram && (
            <a href={`https://instagram.com/${business.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2"><ExternalLink size={18} /> Instagram</Button>
            </a>
          )}
          {business.website && (
            <a href={business.website} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2"><ExternalLink size={18} /> Web</Button>
            </a>
          )}
          <Button variant="ghost" className="gap-2 ml-auto" onClick={handleShare}><Share2 size={18} /> Compartir</Button>
        </div>
      </div>
    </div>
  );
}