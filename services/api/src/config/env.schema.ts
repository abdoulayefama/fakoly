import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  DATABASE_URL: z.string().min(10),
  REDIS_URL: z.string().min(10),

  JWT_ACCESS_SECRET: z.string().min(24),
  JWT_REFRESH_SECRET: z.string().min(24),

  OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(6),
  OTP_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(300),

  INTERNAL_API_KEY: z.string().min(24),

  ADMIN_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).max(86400).default(900),
  ADMIN_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),

  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(10).optional(),

});

export type Env = z.infer<typeof envSchema>;