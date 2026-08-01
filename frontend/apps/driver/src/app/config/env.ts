import { z } from 'zod';

const envSchema = z.object({
  PUBLIC_API_BASE_URL: z.string().default('/api/v1'),
  PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PUBLIC_ENABLE_MOCK: z.coerce.boolean().default(false),
});

function getEnv() {
  const parsed = envSchema.safeParse(import.meta.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten());
    return envSchema.parse({});
  }
  return parsed.data;
}

export const env = getEnv();
