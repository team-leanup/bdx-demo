import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { hasSupabaseEnv } from '@/lib/supabase';

const ALLOWED_NEXT = ['/login', '/signup', '/home', '/onboarding'];

function getSafeNextPath(next: string | null): string {
  if (!next) return '/login';
  const clean = next.replace(/^\/+/, '/');
  if (ALLOWED_NEXT.some((p) => clean === p || clean.startsWith(p + '/'))) {
    return clean;
  }
  return '/login';
}

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = getSafeNextPath(requestUrl.searchParams.get('next'));
  const origin = requestUrl.origin;

  if (!hasSupabaseEnv) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL('/login', origin));
}
