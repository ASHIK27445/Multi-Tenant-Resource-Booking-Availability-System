import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.string().transform(Number).default('12'),
});

export const environment = envSchema.parse(process.env)