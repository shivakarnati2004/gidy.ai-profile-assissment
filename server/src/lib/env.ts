import dotenv from "dotenv";
import path from "path";

dotenv.config();

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
}

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET ?? "dev-secret";

if (isProduction && jwtSecret === "dev-secret") {
  throw new Error("JWT_SECRET must be set in production");
}

export const env = {
  port: parseNumber(process.env.PORT, 4000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  corsOrigin: process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL ?? "*",
  jwtSecret,
  publicApiUrl: process.env.PUBLIC_API_URL ?? process.env.RENDER_EXTERNAL_URL ?? "",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: parseNumber(process.env.SMTP_PORT, 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD ?? "",
  smtpFrom: process.env.SMTP_FROM ?? process.env.EMAIL_FROM ?? "",
  demoUserEmail: process.env.DEMO_USER_EMAIL ?? ""
};
