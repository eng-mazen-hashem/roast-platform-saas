import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const { domain, ...otherOptions } = options || {}
              cookieStore.set(name, value, {
                path: '/',
                sameSite: 'lax',
                secure: true,
                httpOnly: true,
                ...otherOptions,
              })
            })
          } catch (error: any) {
            throw new Error(`cookieStore.set failed: ${error?.message || error}`)
          }
        },
      },
    }
  )
}
