import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseConfigured } from './env';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith('/auth');
  const isProtectedAccount = pathname.startsWith('/account');
  const isProtectedBusiness =
    pathname.startsWith('/business') && !pathname.startsWith('/business/join');

  if (!user && (isProtectedAccount || isProtectedBusiness)) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('next', pathname);
    if (isProtectedBusiness) {
      url.searchParams.set('role', 'business');
    }
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage && !pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone();
    const role = (user.user_metadata?.role as string | undefined) ?? 'user';
    url.pathname = role === 'business' ? '/business' : '/account';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
