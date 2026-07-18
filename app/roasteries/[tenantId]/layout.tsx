import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import DashboardShell from '@/components/layout/dashboard-shell'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

interface RoasteryLayoutProps {
  children: React.ReactNode
  params: {
    tenantId: string
  }
}

export default async function RoasteryLayout({
  children,
  params,
}: RoasteryLayoutProps) {
  const { tenantId } = params
  const supabase = createClient()

  // Retrieve user session
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?error=no_user_in_layout&msg=${encodeURIComponent(error?.message || 'none')}`)
  }

  // Retrieve tenant name from the DB (resilient fallbacks for tenants/roasteries tables)
  let tenantName = `Roastery #${tenantId.substring(0, 8)}`
  
  try {
    // 1. Try querying "tenants"
    const { data: tenantData } = await supabase
      .from('tenants' as any)
      .select('name')
      .eq('id', tenantId)
      .single()

    if (tenantData?.name) {
      tenantName = tenantData.name
    } else {
      // 2. Try querying "roasteries" if "tenants" returns nothing or doesn't exist
      const { data: roasteryData } = await supabase
        .from('roasteries' as any)
        .select('name')
        .eq('id', tenantId)
        .single()

      if (roasteryData?.name) {
        tenantName = roasteryData.name
      }
    }
  } catch (error) {
    // Fallback name is kept in case tables aren't matching
  }

  const userEmail = user.email || 'operator@roastery.com'
  const userRole = user.app_metadata.role || user.user_metadata.role || 'machine_operator'

  return (
    <DashboardShell
      tenantId={tenantId}
      tenantName={tenantName}
      userEmail={userEmail}
      userRole={userRole}
    >
      {children}
    </DashboardShell>
  )
}
