import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().regex(/^\d+$/).default("4000").transform(Number),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  AI_ENCRYPTION_KEY: z.string().min(1, "AI_ENCRYPTION_KEY is required"),
  CLIENT_URL: z.string().url("CLIENT_URL must be a valid URL"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error(
      "Invalid environment variables:",
      JSON.stringify(result.error.flatten().fieldErrors, null, 2)
    );
    process.exit(1);
  }
  return result.data;
}
