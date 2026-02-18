import type { PrismaClient } from "@prisma/client";

export const ensureProfileForUser = async (prisma: PrismaClient, userId: string, email: string) => {
  const profile = await prisma.profile.findUnique({ where: { userId } });

  if (!profile) {
    await prisma.profile.create({
      data: {
        userId,
        displayName: "",
        avatarUrl: "",
        headline: "",
        bio: "",
        location: "",
        contactEmail: email,
        avatarInitials: "",
        resumeUrl: "",
        levelBadge: "",
        graduateBadge: "",
        rewardLeague: "",
        rewardRank: null,
        rewardPoints: null,
        completionPercent: null
      }
    });
  }
};
