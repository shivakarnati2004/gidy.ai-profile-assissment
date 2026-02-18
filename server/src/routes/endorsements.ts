import { Router } from "express";
import prisma from "../lib/prisma";
import { asyncHandler } from "../lib/async-handler";

const router = Router();

router.post("/skills/:skillId/endorse", asyncHandler(async (req, res) => {
  const skillId = req.params.skillId;
  const endorserEmail = (req.body?.endorserEmail as string | undefined)?.trim().toLowerCase();

  if (!endorserEmail) {
    return res.status(400).json({ error: "endorserEmail is required" });
  }

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    return res.status(404).json({ error: "Skill not found" });
  }

  try {
    const endorsement = await prisma.skillEndorsement.create({
      data: {
        skillId,
        endorserEmail
      }
    });

    return res.status(201).json({ id: endorsement.id });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Already endorsed" });
    }

    return res.status(500).json({ error: "Unable to add endorsement" });
  }
}));

router.get("/skills/:skillId/endorsements", asyncHandler(async (req, res) => {
  const skillId = req.params.skillId;
  const count = await prisma.skillEndorsement.count({ where: { skillId } });

  return res.json({ skillId, count });
}));

export default router;
