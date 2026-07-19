'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type ActionResponse = {
  error?: string
}

export async function loginAction(prevState: any, formData: FormData): Promise<ActionResponse & { success?: boolean }> {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return { error: 'Email and password are required' }
    }

    // Proactively check env configurations at runtime
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return { error: `Supabase environment variables are missing on host: URL=${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing'}, KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing'}` }
    }

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    // Redirect directly from the server action to guarantee cookie delivery
    redirect('/dashboard-redirect')
  } catch (err: any) {
    return { error: `Runtime Exception: ${err?.message || err}` }
  }
}
