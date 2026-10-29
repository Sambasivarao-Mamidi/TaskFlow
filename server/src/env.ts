import { config } from "dotenv";
config();

import { loadEnv } from "./config";

export const env = loadEnv();
