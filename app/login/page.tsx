'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      setError('Email and password are required')
      setLoading(false)
      return
    }

    // Call the server-side Route Handler so the server sets the cookies
    // directly in the HTTP response — guaranteeing the correct cookie format
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // ensure cookies from response are saved
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      setError(data.error || 'Login failed')
      setLoading(false)
      return
    }

    // Full-page navigation so the browser sends the freshly set cookies
    window.location.href = '/dashboard-redirect'
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient glowing background circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center">
            {/* Minimalist coffee bean/data icon */}
            <svg
              className="w-6 h-6 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
              />
            </svg>
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-white tracking-tight">
          ARTISAN<span className="text-amber-500">ROAST</span>
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Enterprise Portal
          <br />
          <span className="text-xs text-zinc-500">Monitor your fleet, roast profiles, and modbus telemetry</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-zinc-900/50 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-black/50 sm:rounded-2xl border border-zinc-800/50 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start">
                <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-sm text-red-400 leading-relaxed">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email Address
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@roastery.com"
                  className="appearance-none block w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg placeholder-zinc-500 text-zinc-100 shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Password
              </label>
              <div className="mt-1.5">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="appearance-none block w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg placeholder-zinc-500 text-zinc-100 shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-zinc-950 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
