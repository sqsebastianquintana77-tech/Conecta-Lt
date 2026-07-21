import { NextRequest, NextResponse } from 'next/server';

// Rutas que requieren verificación de edad para acceder a los datos
const PROTECTED_API_PATHS = ['/api/businesses', '/api/reviews'];

// Rutas excluidas (no necesitan verificación de edad)
const EXCLUDED_PATHS = [
  '/api/age-verify',   // endpoint de verificación itself
  '/api/admin',        // protegido por auth
  '/api/auth',         // autenticación
  '/api/route',        // health check
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo proteger rutas API de datos
  const isProtected = PROTECTED_API_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Excluir rutas que no necesitan verificación
  const isExcluded = EXCLUDED_PATHS.some((p) => pathname.startsWith(p));
  if (isExcluded) return NextResponse.next();

  // Verificar cookie de edad
  const ageCookie = request.cookies.get('age_verified');
  if (!ageCookie || ageCookie.value !== 'true') {
    return NextResponse.json(
      { error: 'Verificación de edad requerida', code: 'AGE_REQUIRED' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/businesses/:path*', '/api/reviews/:path*'],
};