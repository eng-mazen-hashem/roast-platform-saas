import { createClient } from '@/utils/supabase/server'
import ProfilesClient from './profiles-client'

interface ProfilesPageProps {
  params: {
    tenantId: string
  }
}

export default async function ProfilesPage({ params }: ProfilesPageProps) {
  const { tenantId } = params
  const supabase = createClient()

  // In production:
  // const { data: historicalLogs } = await supabase
  //   .from('roast_profiles' as any)
  //   .select('*')
  //   .eq('tenant_id', tenantId)
  //   .order('date', { ascending: false })

  return (
    <ProfilesClient
      tenantId={tenantId}
      initialProfiles={[]}
    />
  )
}
