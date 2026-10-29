import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import pino from "pino";
import pinoHttp from "pino-http";

const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: [
    "req.headers.authorization",
    "req.body.password",
    "req.body.accessToken",
    "req.body.refreshToken",
    "req.body.apiKey",
  ],
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

const app = express();

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

import authRoutes from "./routes/auth";
app.use("/api/auth", authRoutes);

import workspaceRoutes from "./routes/workspaces";
app.use("/api/workspaces", workspaceRoutes);

import projectRoutes from "./routes/projects";
app.use("/api", projectRoutes);

import taskRoutes from "./routes/tasks";
app.use("/api", taskRoutes);

import dashboardRoutes from "./routes/dashboard";
app.use("/api", dashboardRoutes);

import aiRoutes from "./routes/ai";
app.use("/api", aiRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);
  res.status(500).json({
    error: { code: "internal_server_error", message: "Internal server error" },
  });
});

export { app };
