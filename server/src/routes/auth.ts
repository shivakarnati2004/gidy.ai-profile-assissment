import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { env } from "../lib/env";
import { generateOtp, hashOtp } from "../lib/otp";
import { sendOtpEmail } from "../lib/mailer";
import { ensureProfileForUser } from "../lib/profile";
import { asyncHandler } from "../lib/async-handler";

const router = Router();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const buildUsername = (email: string) => {
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return base || `user-${Math.random().toString(36).slice(2, 8)}`;
};

const ensureUniqueUsername = async (email: string) => {
  let candidate = buildUsername(email);
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    candidate = `${buildUsername(email)}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const issueToken = (user: { id: string; email: string }) => {
  return jwt.sign({ userId: user.id, email: user.email }, env.jwtSecret, { expiresIn: "7d" });
};

const issueSignupToken = (email: string) => {
  return jwt.sign({ email, purpose: "signup" }, env.jwtSecret, { expiresIn: "15m" });
};

const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

const verifyPassword = (password: string, passwordHash: string) => {
  return bcrypt.compare(password, passwordHash);
};

router.post("/register", asyncHandler(async (req, res) => {
  const signupTokenInput = req.body?.signupToken as string | undefined;
  const passwordInput = req.body?.password as string | undefined;
  const usernameInput = req.body?.username as string | undefined;

  if (!signupTokenInput || !passwordInput) {
    return res.status(400).json({ error: "Signup token and password are required" });
  }

  if (passwordInput.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  let decoded: { email: string; purpose: string };
  try {
    decoded = jwt.verify(signupTokenInput, env.jwtSecret) as { email: string; purpose: string };
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired signup token" });
  }

  if (decoded.purpose !== "signup") {
    return res.status(401).json({ error: "Invalid signup token" });
  }

  const email = normalizeEmail(decoded.email);
  const passwordHash = await hashPassword(passwordInput);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: "Signup session not found" });
  }

  if (user.passwordHash) {
    return res.status(409).json({ error: "Account already exists" });
  }

  const desiredUsername = usernameInput?.trim();
  if (desiredUsername) {
    const existing = await prisma.user.findUnique({ where: { username: desiredUsername } });
    if (existing && existing.id !== user?.id) {
      return res.status(409).json({ error: "Username is already taken" });
    }
  }

  const username = desiredUsername || user.username || (await ensureUniqueUsername(email));

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      username,
      passwordHash
    }
  });

  await ensureProfileForUser(prisma, updatedUser.id, email);

  const token = issueToken(updatedUser);

  return res.json({
    token,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username
    }
  });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const emailInput = req.body?.email as string | undefined;
  const passwordInput = req.body?.password as string | undefined;

  if (!emailInput || !passwordInput) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user?.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const isValid = await verifyPassword(passwordInput, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  await ensureProfileForUser(prisma, user.id, user.email);

  const token = issueToken(user);

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username
    }
  });
}));

router.post("/request-otp", asyncHandler(async (req, res) => {
  const emailInput = req.body?.email as string | undefined;

  if (!emailInput) {
    return res.status(400).json({ error: "Email is required" });
  }

  const email = normalizeEmail(emailInput);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser?.passwordHash) {
    return res.status(409).json({ error: "Account already exists. Please login with password." });
  }

  let user = existingUser;
  if (!existingUser) {
    const username = await ensureUniqueUsername(email);
    user = await prisma.user.create({
      data: {
        email,
        username
      }
    });

    await ensureProfileForUser(prisma, user.id, email);
  }

  if (env.disableOtpVerification) {
    const signupToken = issueSignupToken(email);
    return res.json({
      message: "OTP verification bypassed for this environment",
      signupToken,
      signup: {
        email,
        username: user.username
      }
    });
  }

  const code = generateOtp();
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otpCode.deleteMany({
    where: {
      email,
      consumedAt: null
    }
  });

  await prisma.otpCode.create({
    data: {
      email,
      codeHash,
      expiresAt
    }
  });

  await sendOtpEmail(email, code);

  return res.json({ message: "OTP sent" });
}));

router.post("/verify-otp", asyncHandler(async (req, res) => {
  const emailInput = req.body?.email as string | undefined;
  const codeInput = req.body?.code as string | undefined;

  if (!emailInput || (!env.disableOtpVerification && !codeInput)) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  const email = normalizeEmail(emailInput);
  if (!env.disableOtpVerification) {
    const codeHash = hashOtp((codeInput ?? "").trim());

    const record = await prisma.otpCode.findFirst({
      where: {
        email,
        consumedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!record || record.codeHash !== codeHash) {
      return res.status(401).json({ error: "Invalid or expired code" });
    }

    await prisma.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() }
    });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.passwordHash) {
    return res.status(409).json({ error: "Account already exists. Please login with password." });
  }

  const signupToken = issueSignupToken(user.email);

  return res.json({
    message: "OTP verified",
    signupToken,
    signup: {
      email: user.email,
      username: user.username
    }
  });
}));

export default router;
