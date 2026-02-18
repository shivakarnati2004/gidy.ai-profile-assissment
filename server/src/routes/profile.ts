import { Router, type Request } from "express";
import type { Prisma } from "@prisma/client";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import prisma from "../lib/prisma";
import { env } from "../lib/env";
import { requireAuth } from "../middleware/auth";
import { ensureProfileForUser } from "../lib/profile";
import { asyncHandler } from "../lib/async-handler";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, fileName);
  }
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  }
});

const allowedResumeMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const resumeUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedResumeMimeTypes.has(file.mimetype)) {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
      return;
    }
    cb(null, true);
  }
});

const getPublicBaseUrl = (req: Request) => {
  if (env.publicApiUrl) {
    return env.publicApiUrl.replace(/\/+$/, "");
  }

  return `${req.protocol}://${req.get("host")}`;
};

router.get("/:username", requireAuth, asyncHandler(async (req, res) => {
  const username = req.params.username;
  const payload = req.auth;

  if (!payload) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      profile: true,
      skills: {
        include: { endorsements: true },
        orderBy: { order: "asc" }
      },
      experience: { orderBy: { order: "asc" } },
      education: { orderBy: { order: "asc" } },
      certifications: { orderBy: { order: "asc" } },
      socialLinks: { orderBy: { order: "asc" } },
      careerGoals: { orderBy: { order: "asc" } }
    }
  });

  if (!user) {
    return res.status(404).json({ error: "Profile not found" });
  }

  if (payload.userId !== user.id) {
    return res.status(403).json({ error: "Not authorized to view this profile" });
  }

  if (!user.profile) {
    await ensureProfileForUser(prisma, user.id, user.email);
  }

  const refreshed = await prisma.user.findUnique({
    where: { username },
    include: {
      profile: true,
      skills: {
        include: { endorsements: true },
        orderBy: { order: "asc" }
      },
      experience: { orderBy: { order: "asc" } },
      education: { orderBy: { order: "asc" } },
      certifications: { orderBy: { order: "asc" } },
      socialLinks: { orderBy: { order: "asc" } },
      careerGoals: { orderBy: { order: "asc" } }
    }
  });

  if (!refreshed) {
    return res.status(404).json({ error: "Profile not found" });
  }

  return res.json({
    user: {
      id: refreshed.id,
      email: refreshed.email,
      username: refreshed.username
    },
    profile: refreshed.profile,
    skills: refreshed.skills.map((skill: { id: string; name: string; order: number | null; endorsements: { id: string }[] }) => ({
      id: skill.id,
      name: skill.name,
      order: skill.order,
      endorsementsCount: skill.endorsements.length
    })),
    experience: refreshed.experience,
    education: refreshed.education,
    certifications: refreshed.certifications,
    socialLinks: refreshed.socialLinks,
    careerGoals: refreshed.careerGoals
  });
}));

router.put("/:username", requireAuth, asyncHandler(async (req, res) => {
  const username = req.params.username;
  const payload = req.auth;

  const user = await prisma.user.findUnique({ where: { username }, include: { profile: true } });

  if (!user) {
    return res.status(404).json({ error: "Profile not found" });
  }

  if (!payload || payload.userId !== user.id) {
    return res.status(403).json({ error: "Not authorized to update this profile" });
  }

  const { profile, skills, experience, education, certifications, socialLinks, careerGoals } = req.body ?? {};

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (profile && typeof profile === "object") {
      const updateData = {
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        headline: profile.headline,
        bio: profile.bio,
        location: profile.location,
        contactEmail: profile.contactEmail,
        avatarInitials: profile.avatarInitials,
        resumeUrl: profile.resumeUrl,
        levelBadge: profile.levelBadge,
        graduateBadge: profile.graduateBadge,
        rewardLeague: profile.rewardLeague,
        rewardRank: profile.rewardRank,
        rewardPoints: profile.rewardPoints,
        completionPercent: profile.completionPercent
      };

      if (user.profile) {
        await tx.profile.update({
          where: { userId: user.id },
          data: updateData
        });
      } else {
        await tx.profile.create({
          data: {
            userId: user.id,
            ...updateData
          }
        });
      }
    }

    if (Array.isArray(skills)) {
      await tx.skill.deleteMany({ where: { userId: user.id } });
      if (skills.length > 0) {
        await tx.skill.createMany({
          data: skills.map((item: { name: string; order?: number }, index: number) => ({
            userId: user.id,
            name: item.name,
            order: item.order ?? index
          }))
        });
      }
    }

    if (Array.isArray(experience)) {
      await tx.experience.deleteMany({ where: { userId: user.id } });
      if (experience.length > 0) {
        await tx.experience.createMany({
          data: experience.map(
            (item: { title: string; company: string; location: string; dates: string; description: string; order?: number }, index: number) => ({
              userId: user.id,
              order: item.order ?? index,
              title: item.title,
              company: item.company,
              location: item.location,
              dates: item.dates,
              description: item.description
            })
          )
        });
      }
    }

    if (Array.isArray(education)) {
      await tx.education.deleteMany({ where: { userId: user.id } });
      if (education.length > 0) {
        await tx.education.createMany({
          data: education.map(
            (item: { degree: string; institution: string; year: string; grade?: string; order?: number }, index: number) => ({
              userId: user.id,
              order: item.order ?? index,
              degree: item.degree,
              institution: item.institution,
              year: item.year,
              grade: item.grade
            })
          )
        });
      }
    }

    if (Array.isArray(certifications)) {
      await tx.certification.deleteMany({ where: { userId: user.id } });
      if (certifications.length > 0) {
        await tx.certification.createMany({
          data: certifications.map(
            (item: { name: string; credentialId: string; link?: string; order?: number }, index: number) => ({
              userId: user.id,
              order: item.order ?? index,
              name: item.name,
              credentialId: item.credentialId,
              link: item.link
            })
          )
        });
      }
    }

    if (Array.isArray(socialLinks)) {
      await tx.socialLink.deleteMany({ where: { userId: user.id } });
      if (socialLinks.length > 0) {
        await tx.socialLink.createMany({
          data: socialLinks.map(
            (item: { platform: string; url: string; order?: number }, index: number) => ({
              userId: user.id,
              order: item.order ?? index,
              platform: item.platform,
              url: item.url
            })
          )
        });
      }
    }

    if (Array.isArray(careerGoals)) {
      await tx.careerGoal.deleteMany({ where: { userId: user.id } });
      if (careerGoals.length > 0) {
        await tx.careerGoal.createMany({
          data: careerGoals.map(
            (item: { title: string; description?: string; order?: number }, index: number) => ({
              userId: user.id,
              order: item.order ?? index,
              title: item.title,
              description: item.description
            })
          )
        });
      }
    }
  });

  return res.json({ message: "Profile updated" });
}));

router.post("/:username/photo", requireAuth, imageUpload.single("photo"), asyncHandler(async (req, res) => {
  const username = req.params.username;
  const payload = req.auth;

  const user = await prisma.user.findUnique({ where: { username }, include: { profile: true } });

  if (!user) {
    return res.status(404).json({ error: "Profile not found" });
  }

  if (!payload || payload.userId !== user.id) {
    return res.status(403).json({ error: "Not authorized to upload photo for this profile" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "Photo file is required" });
  }

  const avatarPath = `/uploads/${req.file.filename}`;
  const avatarUrl = `${getPublicBaseUrl(req)}${avatarPath}`;

  if (user.profile) {
    await prisma.profile.update({
      where: { userId: user.id },
      data: { avatarUrl }
    });
  } else {
    await prisma.profile.create({
      data: {
        userId: user.id,
        avatarUrl,
        contactEmail: user.email,
        displayName: ""
      }
    });
  }

  return res.status(201).json({ avatarUrl });
}));

router.post("/:username/resume", requireAuth, resumeUpload.single("resume"), asyncHandler(async (req, res) => {
  const username = req.params.username;
  const payload = req.auth;

  const user = await prisma.user.findUnique({ where: { username }, include: { profile: true } });

  if (!user) {
    return res.status(404).json({ error: "Profile not found" });
  }

  if (!payload || payload.userId !== user.id) {
    return res.status(403).json({ error: "Not authorized to upload resume for this profile" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "Resume file is required" });
  }

  const resumePath = `/uploads/${req.file.filename}`;
  const resumeUrl = `${getPublicBaseUrl(req)}${resumePath}`;

  if (user.profile) {
    await prisma.profile.update({
      where: { userId: user.id },
      data: { resumeUrl }
    });
  } else {
    await prisma.profile.create({
      data: {
        userId: user.id,
        resumeUrl,
        contactEmail: user.email,
        displayName: ""
      }
    });
  }

  return res.status(201).json({ resumeUrl });
}));

export default router;
