import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { hasSupabaseEnv } from '@/lib/supabase';

function getSafeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/')) {
    return '/login';
  }

  return next;
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
