import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl, isDemoAccessEnabled, isSupabaseConfigured } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const demoCookie = request.cookies.get("udla-demo")?.value === "1";

  if (!isSupabaseConfigured()) {
    if (
      request.nextUrl.pathname === "/" ||
      demoCookie ||
      isDemoAccessEnabled()
    ) {
      if (
        request.nextUrl.pathname.startsWith("/academico") &&
        !demoCookie &&
        !isDemoAccessEnabled()
      ) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return supabaseResponse;
    }
    if (request.nextUrl.pathname.startsWith("/academico")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
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

  const { pathname } = request.nextUrl;
  const isAcademico = pathname.startsWith("/academico");
  const isLanding = pathname === "/";

  if (isAcademico && !user) {
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isLanding && user) {
    return NextResponse.redirect(new URL("/academico", request.url));
  }

  return supabaseResponse;
}
