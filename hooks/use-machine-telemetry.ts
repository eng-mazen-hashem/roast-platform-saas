import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface Machine {
  id: string
  name: string
  status: 'online' | 'offline'
  bean_temp: number
  env_temp: number
  power_source: 'main' | 'battery'
  tenant_id: string
  last_seen_at?: string
}

export function useMachineTelemetry(tenantId: string, initialMachines: Machine[] = []) {
  const [machines, setMachines] = useState<Machine[]>(initialMachines)
  const supabase = createClient()

  useEffect(() => {
    // If initial machines are updated, sync state
    setMachines(initialMachines)
  }, [initialMachines])

  useEffect(() => {
    if (!tenantId) return

    // Setup realtime subscription
    const channel = supabase
      .channel(`realtime:fleet:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'machines',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedMachine = payload.new as Machine
            setMachines((prev) =>
              prev.map((machine) =>
                machine.id === updatedMachine.id ? updatedMachine : machine
              )
            )
          } else if (payload.eventType === 'INSERT') {
            const newMachine = payload.new as Machine
            setMachines((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === newMachine.id)) return prev
              return [...prev, newMachine]
            })
          } else if (payload.eventType === 'DELETE') {
            const oldMachine = payload.old as { id: string }
            setMachines((prev) => prev.filter((m) => m.id !== oldMachine.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, supabase])

  return machines
}
