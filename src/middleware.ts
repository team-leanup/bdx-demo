import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/splash', '/intro', '/login', '/signup', '/signup/google', '/intro-demo', '/terms', '/privacy', '/auth/callback', '/qr'];
const PUBLIC_PREFIXES = ['/onboarding', '/consultation', '/pre-consult', '/share', '/_next', '/api', '/auth'];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname.includes('.')) return true;
  return false;
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com; frame-src https://accounts.google.com;",
  );
  return response;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!isPublicRoute(pathname)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return applySecurityHeaders(response);
  }

  // Auth callback은 PKCE code verifier 쿠키를 보존해야 하므로 건너뜀
  if (pathname.startsWith('/auth/callback')) {
    return response;
  }

  // Public 경로는 세션 체크 불필요
  if (isPublicRoute(pathname)) {
    return applySecurityHeaders(response);
  }

  // 데모 모드 (Supabase 세션 없이 로컬 상태로 동작)
  if (request.cookies.get('bdx-demo')?.value === 'true') {
    return applySecurityHeaders(response);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  applySecurityHeaders(response);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
