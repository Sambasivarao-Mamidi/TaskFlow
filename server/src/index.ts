import "./env";
import { app } from "./app";
import { connectDB } from "./db";
import { env } from "./env";

async function bootstrap(): Promise<void> {
  await connectDB(env.MONGO_URI);

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`TaskFlow server listening on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

bootstrap().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});
