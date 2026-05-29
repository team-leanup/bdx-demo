import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { hasSupabaseEnv } from '@/lib/supabase';

const ALLOWED_NEXT = ['/login', '/signup', '/home', '/onboarding'];

function getSafeNextPath(next: string | null): string {
  if (!next) return '/login';
  let normalized: string;
  try {
    normalized = new URL(next, 'https://x').pathname;
  } catch {
    return '/login';
  }
  if (ALLOWED_NEXT.some((p) => normalized === p || normalized.startsWith(p + '/'))) {
    return normalized;
  }
  return '/login';
}

function buildErrorRedirect(origin: string, code: string): URL {
  const url = new URL('/login', origin);
  url.searchParams.set('oauth_error', code);
  return url;
}

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const oauthError = requestUrl.searchParams.get('error');
  const next = getSafeNextPath(requestUrl.searchParams.get('next'));
  const origin = requestUrl.origin;

  if (!hasSupabaseEnv) {
    return NextResponse.redirect(buildErrorRedirect(origin, 'env_missing'));
  }

  // Supabase가 OAuth provider 에러를 리턴한 경우 (provider 미설정 등)
  if (oauthError) {
    console.error('[auth/callback] oauth provider error:', oauthError);
    return NextResponse.redirect(buildErrorRedirect(origin, 'provider_error'));
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }

    console.error('[auth/callback] exchange error:', error.message);
    return NextResponse.redirect(buildErrorRedirect(origin, 'exchange_failed'));
  }

  return NextResponse.redirect(buildErrorRedirect(origin, 'no_code'));
}
