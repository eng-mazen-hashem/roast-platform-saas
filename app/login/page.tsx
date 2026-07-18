'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { loginAction } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-zinc-950 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
    >
      {pending ? (
        <span className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-zinc-950" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Authenticating...</span>
        </span>
      ) : (
        'Sign in'
      )}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, {})

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient glowing background circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto w-full sm:max-w-md z-10">
        {/* Custom Industrial IoT Coffee Logo */}
        <div className="flex justify-center items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Flame/Steam & Coffee bean stylized outline */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-wider text-zinc-100 uppercase">
            Artisan<span className="text-amber-500">Roast</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-100 tracking-tight">
          Enterprise Portal
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Monitor your fleet, roast profiles, and modbus telemetry
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-zinc-900/50 backdrop-blur-md py-8 px-4 border border-zinc-800 shadow-xl rounded-2xl sm:px-10">
          <form action={formAction} className="space-y-6">
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

            {state?.error && (
              <div className="rounded-lg bg-red-950/30 border border-red-800/40 p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-400">{state.error}</p>
                  </div>
                </div>
              </div>
            )}

            <SubmitButton />
          </form>
        </div>
      </div>
    </div>
  )
}
