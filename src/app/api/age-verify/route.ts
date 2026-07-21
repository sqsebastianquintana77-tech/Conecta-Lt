import { NextResponse } from 'next/server';

// POST /api/age-verify — setea cookie HttpOnly de verificación de edad
export async function POST() {
  const response = NextResponse.json({ verified: true });

  // Cookie HttpOnly, Secure en producción, válida por 1 año
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set('age_verified', 'true', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 1 año
  });

  return response;
}

// GET /api/age-verify — verifica si la cookie ya existe
export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') ?? '';
  const hasCookie = cookie.includes('age_verified=true');

  return NextResponse.json({ verified: hasCookie });
}