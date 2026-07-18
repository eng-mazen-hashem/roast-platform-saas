import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const { domain, ...otherOptions } = options || {}
            const mergedOptions = {
              path: '/',
              sameSite: 'lax' as const,
              secure: true,
              httpOnly: true,
              ...otherOptions,
            }
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, mergedOptions)
          })
        },
      },
    }
  )

  // Retrieve user session securely
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const path = url.pathname

  const isAuthRoute = path.startsWith('/login')
  const isSuperAdminRoute = path.startsWith('/super-admin')
  const isRoasteryRoute = path.startsWith('/roasteries')

  // Rule 1: Redirect unauthenticated users trying to access dashboard/admin routes
  if ((isRoasteryRoute || isSuperAdminRoute) && !user) {
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  // Rule 2: Redirect logged-in users visiting auth pages to their proper dashboard redirection route
  if (isAuthRoute && user) {
    url.pathname = '/dashboard-redirect'
    return NextResponse.redirect(url)
  }

  // Rule 3: Enforce strict tenant access boundaries for roastery paths
  // URL: /roasteries/[tenantId]/...
  if (isRoasteryRoute && user) {
    const tenantMatch = path.match(/^\/roasteries\/([^/]+)/)
    if (tenantMatch) {
      const requestedTenantId = tenantMatch[1]
      let userTenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id
      let userRole = user.app_metadata.role || user.user_metadata.role

      // Database fallback if JWT claim isn't propagated to cookie session yet
      if (!userTenantId || !userRole) {
        try {
          const { data: profile } = await supabase
            .from('profiles' as any)
            .select('role, tenant_id')
            .eq('id', user.id)
            .single()
          if (profile) {
            userRole = (profile as any).role
            userTenantId = (profile as any).tenant_id
          }
        } catch (err) {
          // Keep defaults if query fails
        }
      }

      const isSuperAdmin = userRole === 'super_admin'

      // Block access if they are neither a Super Admin nor assigned to the requested roastery (tenant)
      if (!isSuperAdmin && userTenantId !== requestedTenantId) {
        if (userTenantId) {
          url.pathname = `/roasteries/${userTenantId}/fleet`
          return NextResponse.redirect(url)
        } else {
          // If the authenticated user has no assigned tenant, send back to login with a warning
          url.pathname = '/login'
          url.searchParams.set('error', 'unauthorized_tenant')
          return NextResponse.redirect(url)
        }
      }
    }
  }

  // Rule 4: Restrict super-admin routes to super_admin role only
  if (isSuperAdminRoute && user) {
    let userRole = user.app_metadata.role || user.user_metadata.role
    let userTenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id

    if (!userRole) {
      try {
        const { data: profile } = await supabase
          .from('profiles' as any)
          .select('role, tenant_id')
          .eq('id', user.id)
          .single()
        if (profile) {
          userRole = (profile as any).role
          userTenantId = (profile as any).tenant_id
        }
      } catch (err) {
        // Keep defaults
      }
    }

    if (userRole !== 'super_admin') {
      if (userTenantId) {
        url.pathname = `/roasteries/${userTenantId}/fleet`
      } else {
        url.pathname = '/login'
        url.searchParams.set('error', 'unauthorized_admin')
      }
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
