import { createClient } from '@/utils/supabase/server'
import FleetDashboard from './fleet-dashboard'
import { Machine } from '@/hooks/use-machine-telemetry'

interface FleetPageProps {
  params: {
    tenantId: string
  }
}

export default async function FleetPage({ params }: FleetPageProps) {
  const { tenantId } = params
  const supabase = createClient()

  let initialMachines: Machine[] = []

  try {
    const { data: machinesData } = await supabase
      .from('machines')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    if (machinesData) {
      initialMachines = machinesData as Machine[]
    }
  } catch (error) {
    // If the database is missing telemetry tables or connection fails, we degrade gracefully to empty state
  }

  return (
    <FleetDashboard
      tenantId={tenantId}
      initialMachines={initialMachines}
    />
  )
}
