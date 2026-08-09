import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import {
  DEMO_SESSION_COOKIE,
  getDemoSessionUserFromToken,
} from '@/lib/demo-auth';
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseConfigured } from './env';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const demoUser = getDemoSessionUserFromToken(
    request.cookies.get(DEMO_SESSION_COOKIE)?.value,
  );

  let supabaseRole: string | undefined;

  if (isSupabaseConfigured()) {
    const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      supabaseRole = (user.user_metadata?.role as string | undefined) ?? 'user';
    }
  }

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith('/auth');
  const isProtectedAccount = pathname.startsWith('/account');
  // Весь кабинет бизнеса защищён; публичная точка входа — /auth/register?role=business
  const isProtectedBusiness =
    pathname === '/business' || pathname.startsWith('/business/');

  const isLoggedIn = Boolean(demoUser || supabaseRole);

  if (!isLoggedIn && (isProtectedAccount || isProtectedBusiness)) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('next', pathname);
    if (isProtectedBusiness) {
      url.searchParams.set('role', 'business');
    }
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && isAuthPage && !pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone();
    const role = demoUser?.role ?? supabaseRole ?? 'user';
    url.pathname = role === 'business' ? '/business' : '/account';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
