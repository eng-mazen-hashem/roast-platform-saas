import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function DashboardRedirectPage() {
  const supabase = createClient()
  
  // Diagnostic check: read session first
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (!user) {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    const cookieNames = allCookies.map(c => `${c.name}(len:${c.value.length})`).join(', ')
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const sessStatus = session ? 'session_present' : 'no_session'
    const sessErr = sessionError?.message || 'none'
    const usrErr = userError?.message || 'none'
    
    redirect(`/login?error=no_user_in_redirect&msg=${encodeURIComponent(usrErr)}&sessStatus=${sessStatus}&sessErr=${encodeURIComponent(sessErr)}&cookies=${encodeURIComponent(cookieNames || 'none')}&envUrl=${hasUrl}&envKey=${hasKey}`)
  }

  // 1. Check custom metadata claims for role and tenant_id
  let role = user.app_metadata.role || user.user_metadata.role
  let tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id

  // 2. Database fallback if metadata sync trigger hasn't run yet
  if (!role || (!tenantId && role !== 'super_admin')) {
    // Note: Cast as 'any' to bypass missing Database types file compilation checks
    const { data: profile } = await supabase
      .from('profiles' as any)
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (profile) {
      role = (profile as any).role
      tenantId = (profile as any).tenant_id

      // Attempt to sync local session metadata for future visits
      await supabase.auth.updateUser({
        data: { role, tenant_id: tenantId }
      })
    }
  }

  // 3. Routing Engine based on user role and tenant
  if (role === 'super_admin') {
    redirect('/super-admin')
  }

  if (tenantId) {
    redirect(`/roasteries/${tenantId}/fleet`)
  }

  // Fallback if the user has authenticated but is not assigned to a roastery
  redirect('/login?error=no_assigned_tenant')
}
