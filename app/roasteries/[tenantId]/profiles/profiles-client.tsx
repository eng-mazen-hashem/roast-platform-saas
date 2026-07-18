'use client'

import { useState } from 'react'
import RoastProfileChart, { TelemetryPoint } from '@/components/charts/roast-profile-chart'

export interface HistoricalRoast {
  id: string
  date: string
  machineName: string
  beanType: string
  duration: string
  peakTemp: number
  batchWeight: string // Added B2B metric
  curve: TelemetryPoint[]
}

// 12-minute coffee roast curves simulation helper
const generateMockCurve = (peakBT: number, peakET: number, durationMinutes: number): TelemetryPoint[] => {
  const points: TelemetryPoint[] = []
  
  // Starting charge temperatures
  const startBT = 200 // Drop temp
  const startET = 220

  for (let i = 0; i <= durationMinutes; i++) {
    const timeStr = `${i.toString().padStart(2, '0')}:00`
    let bt = 0
    let et = 0

    if (i === 0) {
      bt = startBT
      et = startET
    } else if (i === 1) {
      // Bottoming out / turning point
      bt = 92
      et = 150
    } else if (i === 2) {
      bt = 115
      et = 180
    } else {
      // Steady climb towards peak
      const progress = (i - 2) / (durationMinutes - 2)
      bt = 115 + (peakBT - 115) * Math.sin(progress * (Math.PI / 2))
      et = 180 + (peakET - 180) * Math.sin(progress * (Math.PI / 2.1))
    }

    points.push({
      time: timeStr,
      beanTemp: Math.round(bt * 10) / 10,
      envTemp: Math.round(et * 10) / 10,
    })
  }

  return points
}

const defaultProfiles: HistoricalRoast[] = [
  {
    id: 'roast-01',
    date: '2026-07-18 10:15',
    machineName: 'Roaster A-100',
    beanType: 'Ethiopia Yirgacheffe (Washed)',
    duration: '11m 00s',
    peakTemp: 211.5,
    batchWeight: '15.0 kg',
    curve: generateMockCurve(211.5, 238.0, 11),
  },
  {
    id: 'roast-02',
    date: '2026-07-17 14:30',
    machineName: 'Roaster A-100',
    beanType: 'Colombia Supremo (Natural)',
    duration: '12m 00s',
    peakTemp: 216.2,
    batchWeight: '15.2 kg',
    curve: generateMockCurve(216.2, 244.5, 12),
  },
  {
    id: 'roast-03',
    date: '2026-07-16 09:00',
    machineName: 'Roaster B-200',
    beanType: 'Sumatra Mandheling (Dark)',
    duration: '13m 00s',
    peakTemp: 222.8,
    batchWeight: '30.0 kg',
    curve: generateMockCurve(222.8, 252.0, 13),
  },
]

interface ProfilesClientProps {
  tenantId: string
  initialProfiles?: HistoricalRoast[]
}

export default function ProfilesClient({ tenantId, initialProfiles }: ProfilesClientProps) {
  const profiles = initialProfiles && initialProfiles.length > 0 ? initialProfiles : defaultProfiles
  const [selectedProfileId, setSelectedProfileId] = useState<string>(profiles[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  const activeRoast = profiles.find((p) => p.id === selectedProfileId) || profiles[0]

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.beanType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDate = selectedDate ? p.date.startsWith(selectedDate) : true

    return matchesSearch && matchesDate
  })

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-6 border-b border-zinc-900">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-50 tracking-tight">Roast Profiles</h1>
        <p className="text-zinc-400 text-sm mt-1">Review historical roasting logs and heat development charts.</p>
      </div>

      {/* Main Grid: Chart on Top, Table below */}
      <div className="grid grid-cols-1 gap-6">
        {/* Roast curve display card */}
        <div className="space-y-4">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-800 mb-6 gap-3">
              <div>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  Active Profile Analysis
                </span>
                <h2 className="text-lg font-bold text-zinc-100 mt-2">{activeRoast.beanType}</h2>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  Logged on {activeRoast.date} via {activeRoast.machineName}
                </p>
              </div>

              {/* Stats pill */}
              <div className="flex flex-wrap gap-4 text-xs font-mono">
                <div className="bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-850">
                  <span className="text-zinc-500 block text-[9px] uppercase">Batch size</span>
                  <span className="text-zinc-300 font-bold">{activeRoast.batchWeight}</span>
                </div>
                <div className="bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-850">
                  <span className="text-zinc-500 block text-[9px] uppercase">Duration</span>
                  <span className="text-zinc-300 font-bold">{activeRoast.duration}</span>
                </div>
                <div className="bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-850">
                  <span className="text-zinc-500 block text-[9px] uppercase">Peak BT</span>
                  <span className="text-amber-500 font-bold">{activeRoast.peakTemp.toFixed(1)}°C</span>
                </div>
              </div>
            </div>

            <RoastProfileChart data={activeRoast.curve} title="BT / ET Telemetry Curve Over Time" />
          </div>
        </div>

        {/* Filters and Table Card */}
        <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-6 space-y-6">
          <h3 className="text-md font-semibold text-zinc-200">Historical Roast Logs</h3>
          
          {/* Table Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search beans or machines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-xs placeholder-zinc-500 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all duration-150"
              />
            </div>

            <div className="w-full sm:w-auto">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all duration-150"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-zinc-900 rounded-lg">
            <table className="min-w-full divide-y divide-zinc-900 text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Machine</th>
                  <th className="px-6 py-3.5">Bean Type</th>
                  <th className="px-6 py-3.5">Batch size</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Peak Temp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 bg-zinc-900/10">
                {filteredProfiles.map((p) => {
                  const isSelected = p.id === selectedProfileId
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProfileId(p.id)}
                      className={`cursor-pointer hover:bg-zinc-850/50 transition-colors duration-150 ${
                        isSelected ? 'bg-zinc-850 text-zinc-55 text-zinc-50 border-l-2 border-amber-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-mono">{p.date}</td>
                      <td className="px-6 py-4 font-medium text-zinc-200">{p.machineName}</td>
                      <td className="px-6 py-4 text-zinc-200">{p.beanType}</td>
                      <td className="px-6 py-4 font-mono">{p.batchWeight}</td>
                      <td className="px-6 py-4 font-mono">{p.duration}</td>
                      <td className="px-6 py-4 font-mono font-semibold text-amber-500">{p.peakTemp.toFixed(1)}°C</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
