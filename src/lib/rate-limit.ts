import { NextRequest, NextResponse } from 'next/server';

// Rate limiter simple en memoria por IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60_000; // 1 minuto
const MAX_REQUESTS = 60;  // 60 requests por minuto por IP

export function rateLimit(request: NextRequest): { allowed: boolean; remaining: number } {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip') 
    || 'unknown';
  
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS - record.count };
}

// Limpieza periodica cada 5 minutos
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
      if (now > record.resetTime) requestCounts.delete(key);
    }
  }, 300_000);
}

// Middleware para usar en API routes
export function withRateLimit(handler: Function) {
  return async (request: NextRequest, context: any) => {
    const { allowed, remaining } = rateLimit(request);
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
        { 
          status: 429,
          headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0' }
        }
      );
    }

    const response = await handler(request, context);
    if (response.headers) {
      response.headers.set('X-RateLimit-Remaining', String(remaining));
    }
    return response;
  };
}