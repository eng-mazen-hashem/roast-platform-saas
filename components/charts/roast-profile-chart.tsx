'use client'

import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

export interface TelemetryPoint {
  time: string // MM:SS format
  beanTemp: number // BT
  envTemp: number // ET
}

interface RoastProfileChartProps {
  data: TelemetryPoint[]
  title?: string
}

export default function RoastProfileChart({ data, title = 'Roast Temperature Curve' }: RoastProfileChartProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="h-[350px] w-full bg-zinc-900/10 border border-zinc-850 rounded-xl animate-pulse flex items-center justify-center text-zinc-500 text-xs font-mono">
        Configuring canvas telemetry render...
      </div>
    )
  }

  // Custom tooltips to fit our dark B2B IoT aesthetic
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 shadow-xl font-mono text-xs space-y-1.5">
          <p className="text-zinc-400 font-semibold">Time: {label}</p>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-zinc-300">BT (Bean):</span>
            <span className="text-amber-500 font-bold">{payload[0].value.toFixed(1)}°C</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-zinc-400" />
            <span className="text-zinc-300">ET (Env):</span>
            <span className="text-zinc-100 font-bold">{payload[1].value.toFixed(1)}°C</span>
          </div>
          {payload[0].value >= 196 && (
            <p className="text-[10px] text-amber-500/80 italic mt-1 border-t border-zinc-800 pt-1">
              * First Crack Range (BT &gt; 196°C)
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">{title}</h3>
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-zinc-400">Bean Temp (BT)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-400" />
            <span className="text-zinc-400">Environmental (ET)</span>
          </div>
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[50, 260]}
              tickFormatter={(val) => `${val}°C`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="beanTemp"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: '#18181b', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="envTemp"
              stroke="#a1a1aa"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4, stroke: '#18181b', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
