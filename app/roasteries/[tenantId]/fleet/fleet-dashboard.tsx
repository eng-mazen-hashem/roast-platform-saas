'use client'

import { useState } from 'react'
import { useMachineTelemetry, Machine } from '@/hooks/use-machine-telemetry'

interface FleetDashboardProps {
  tenantId: string
  initialMachines: Machine[]
}

export default function FleetDashboard({ tenantId, initialMachines }: FleetDashboardProps) {
  const machines = useMachineTelemetry(tenantId, initialMachines)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all')

  const filteredMachines = machines.filter((machine) => {
    const matchesSearch = machine.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          machine.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && machine.status === statusFilter
  })

  return (
    <div className="space-y-8">
      {/* 1. Dashboard Page Title and Statistics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-6 border-b border-zinc-900">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-50 tracking-tight">Machine Fleet</h1>
          <p className="text-zinc-400 text-sm mt-1">Live telemetry monitoring and emergency power state controls.</p>
        </div>
        
        {/* Real-time indicator widget */}
        <div className="flex items-center space-x-3 bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-xl text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-zinc-300">Supabase Realtime Active</span>
        </div>
      </div>

      {/* 2. Filters & Searches */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/30 p-4 border border-zinc-900 rounded-xl">
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by machine name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm placeholder-zinc-500 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all duration-150"
          />
        </div>

        <div className="flex space-x-2 w-full sm:w-auto">
          {(['all', 'online', 'offline'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-medium border uppercase tracking-wider transition-all duration-150 ${
                statusFilter === filter
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-sm'
                  : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Machine Fleet Grid */}
      {filteredMachines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-800 rounded-2xl">
          <svg className="w-12 h-12 text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-zinc-400 text-sm">No machines found matching filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMachines.map((machine) => {
            const isPowerLost = machine.power_source === 'battery'
            const isOnline = machine.status === 'online'

            return (
              <div
                key={machine.id}
                className={`bg-zinc-900/40 backdrop-blur-sm rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  isPowerLost && isOnline
                    ? 'border-red-500/50 animate-pulse bg-red-950/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                    : 'border-zinc-800 hover:border-zinc-750'
                }`}
              >
                {/* Visual indicator bar at the top of the card */}
                <div
                  className={`h-1.5 w-full ${
                    !isOnline
                      ? 'bg-zinc-700'
                      : isPowerLost
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-emerald-500'
                  }`}
                />

                {/* Card Body */}
                <div className="p-5 space-y-5 flex-1">
                  {/* Top line: Name and Status */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-zinc-100 tracking-tight text-lg">{machine.name}</h3>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase">ID: {machine.id.substring(0, 8)}</p>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase border ${
                        isOnline
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-850 border-zinc-800 text-zinc-500'
                      }`}
                    >
                      {isOnline && (
                        <span className="relative flex h-1.5 w-1.5 mr-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                      )}
                      {machine.status}
                    </span>
                  </div>

                  {/* Telemetry Measurements Section */}
                  <div className="grid grid-cols-2 gap-4 py-3 px-4 bg-zinc-950/60 rounded-lg border border-zinc-900">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Bean Temp (BT)</span>
                      <div className="flex items-baseline space-x-1.5 mt-1.5">
                        <span className="text-xl font-bold text-amber-500 font-mono">
                          {isOnline ? `${machine.bean_temp.toFixed(1)}` : '--.-'}
                        </span>
                        <span className="text-xs text-zinc-400">°C</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Env Temp (ET)</span>
                      <div className="flex items-baseline space-x-1.5 mt-1.5">
                        <span className="text-xl font-bold text-zinc-200 font-mono">
                          {isOnline ? `${machine.env_temp.toFixed(1)}` : '--.-'}
                        </span>
                        <span className="text-xs text-zinc-400">°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Power Supply Status Notification */}
                  {isOnline && (
                    <div className="mt-2">
                      {isPowerLost ? (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 flex items-start space-x-2.5">
                          <svg className="w-5.5 h-5.5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider">Main AC Power Outage</h4>
                            <p className="text-[10px] text-red-400/80 leading-relaxed font-mono">
                              220V interrupted. ESP32 running on battery. Drum door emergency override enabled.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-zinc-950/20 border border-zinc-850 rounded-lg p-2.5 text-zinc-400 flex items-center space-x-2">
                          <svg className="w-4.5 h-4.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-xs font-mono">Main AC Power (220V - Stable)</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!isOnline && (
                    <div className="bg-zinc-950/20 border border-zinc-850 rounded-lg p-2.5 text-zinc-500 flex items-center space-x-2 justify-center">
                      <span className="text-[11px] uppercase tracking-wider font-semibold">Telemetry Feed Inactive</span>
                    </div>
                  )}
                </div>

                {/* Card Footer actions */}
                <div className="px-5 py-3.5 border-t border-zinc-900 bg-zinc-950/30 flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {machine.last_seen_at
                      ? `Last updated: ${new Date(machine.last_seen_at).toLocaleTimeString()}`
                      : 'Connection Offline'}
                  </span>
                  <button
                    disabled={!isOnline}
                    className="text-xs font-medium text-amber-500 hover:text-amber-400 disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
                  >
                    Control Panel &rarr;
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
