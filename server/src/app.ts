import express from "express";
import cors from "cors";
import multer from "multer";
import { env } from "./lib/env";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import endorsementRoutes from "./routes/endorsements";

const app = express();
app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.corsOrigins.includes("*") ? true : env.corsOrigins,
    credentials: true
  })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api", endorsementRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  return res.status(500).json({ error: message });
});

export default app;