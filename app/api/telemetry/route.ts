import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { telemetryPayloadSchema } from '@/lib/validations/telemetry'

export async function POST(request: NextRequest) {
  // 1. Verify Authorization Bearer token (IoT device authentication)
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing or malformed Bearer authorization token' },
      { status: 401 }
    )
  }

  const token = authHeader.split(' ')[1]
  const expectedToken = process.env.TELEMETRY_API_KEY

  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid API key credentials' },
      { status: 401 }
    )
  }

  // 2. Parse and Validate Request Body
  try {
    const jsonBody = await request.json()
    const parseResult = telemetryPayloadSchema.safeParse(jsonBody)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Bad Request: Invalid telemetry payload properties',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { machineId, tenantId, beanTemp, envTemp, powerStatus } = parseResult.data

    // 3. Initialize Supabase Client with service role key to bypass RLS for IoT updates
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // 4. Update the machine record in Supabase
    // Map powerStatus boolean flag to 'main' / 'battery' enums
    const { data: updatedRecord, error: dbError } = await supabaseAdmin
      .from('machines')
      .update({
        bean_temp: beanTemp,
        env_temp: envTemp,
        power_source: powerStatus ? 'main' : 'battery',
        status: 'online',
        last_seen_at: new Date().toISOString(),
      } as any)
      .eq('id', machineId)
      .eq('tenant_id', tenantId)
      .select()

    if (dbError) {
      return NextResponse.json(
        { error: 'Internal Server Error: Database update failed', details: dbError.message },
        { status: 500 }
      )
    }

    if (!updatedRecord || updatedRecord.length === 0) {
      return NextResponse.json(
        { error: 'Not Found: Machine matching parameters not found under this tenant' },
        { status: 404 }
      )
    }

    // 5. Success response (optimized payload for hardware overhead)
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    })
  } catch (parseError) {
    return NextResponse.json(
      { error: 'Bad Request: Malformed JSON syntax' },
      { status: 400 }
    )
  }
}
