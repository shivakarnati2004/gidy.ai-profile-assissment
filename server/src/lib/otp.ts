import crypto from "crypto";
import { env } from "./env";

export const generateOtp = () => {
  const code = crypto.randomInt(100000, 1000000).toString();
  return code;
};

export const hashOtp = (code: string) => {
  return crypto.createHash("sha256").update(`${code}:${env.jwtSecret}`).digest("hex");
};
