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

const parseBoolean = (value: string | undefined, fallback = false) => {
  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
};

const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET ?? "dev-secret";
const configuredCorsOrigin = process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL ?? "";
const corsOrigins = configuredCorsOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isProduction && jwtSecret === "dev-secret") {
  throw new Error("JWT_SECRET must be set in production");
}

if (isProduction && corsOrigins.length === 0) {
  throw new Error("CORS_ORIGIN (or FRONTEND_URL) must be set in production");
}

export const env = {
  port: parseNumber(process.env.PORT, 4000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  corsOrigins: corsOrigins.length > 0 ? corsOrigins : ["*"],
  jwtSecret,
  publicApiUrl: process.env.PUBLIC_API_URL ?? "",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: parseNumber(process.env.SMTP_PORT, 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD ?? "",
  smtpFrom: process.env.SMTP_FROM ?? process.env.EMAIL_FROM ?? "",
  demoUserEmail: process.env.DEMO_USER_EMAIL ?? "",
  disableOtpVerification: parseBoolean(process.env.DISABLE_OTP_VERIFICATION, false)
};
