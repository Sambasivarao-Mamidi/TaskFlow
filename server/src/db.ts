import mongoose from "mongoose";

export async function connectDB(uri: string): Promise<void> {
  await mongoose.connect(uri, {
    autoIndex: true,
  });

  // Replica set is required for transactional deletes (Phase 2+).
  // Log the connected host for visibility.
  // eslint-disable-next-line no-console
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

export { mongoose };
