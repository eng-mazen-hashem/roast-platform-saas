import { z } from 'zod'

export const telemetryPayloadSchema = z.object({
  machineId: z.string().uuid({ message: 'Invalid machineId UUID format' }),
  tenantId: z.string().uuid({ message: 'Invalid tenantId UUID format' }),
  beanTemp: z
    .number()
    .min(-50, { message: 'Bean temperature below range boundary (-50°C)' })
    .max(450, { message: 'Bean temperature above safety limit (450°C)' }),
  envTemp: z
    .number()
    .min(-50, { message: 'Environmental temperature below range boundary (-50°C)' })
    .max(450, { message: 'Environmental temperature above safety limit (450°C)' }),
  powerStatus: z.boolean({
    required_error: 'powerStatus flag is required',
    invalid_type_error: 'powerStatus must be a boolean value',
  }),
})

export type TelemetryPayload = z.infer<typeof telemetryPayloadSchema>
