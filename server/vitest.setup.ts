import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(__dirname, ".env") });

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/taskflow_test";

export async function setupDB() {
  // Use a test database by replacing the db name
  const testUri = MONGO_URI.replace(/\/[^/?]+(\?|$)/, "/taskflow_test$1");
  await mongoose.connect(testUri, { autoIndex: false });
}

export async function teardownDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

export async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}
