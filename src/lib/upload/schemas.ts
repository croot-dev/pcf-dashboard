import { z } from "zod"

export const ImportRowSchema = z.object({
  id: z.string(),
  rowNumber: z.number(),
  date: z.string(),
  activityType: z.string(),
  sourceName: z.string(),
  amount: z.string(),
  unit: z.string(),
  productCode: z.string(),
  productName: z.string(),
  emissionFactorId: z.string().nullable(),
  factor: z.number().nullable(),
  co2e: z.number().nullable(),
  status: z.enum(["valid", "warning", "error"]),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  raw: z.record(z.string(), z.unknown()),
})
