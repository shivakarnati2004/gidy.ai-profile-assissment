import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type BuildBioSummaryInput = {
  displayName?: string;
  headline?: string;
  skills: string[];
  goals: string[];
};

export function buildBioSummary(input: BuildBioSummaryInput) {
  const cleanSkills = input.skills.map((skill) => skill.trim()).filter(Boolean).slice(0, 4);
  const cleanGoals = input.goals.map((goal) => goal.trim()).filter(Boolean).slice(0, 2);

  const intro = input.displayName?.trim()
    ? `${input.displayName.trim()} is a`
    : "I am a";

  const role = input.headline?.trim() || "motivated professional";

  const skillsPart = cleanSkills.length > 0
    ? ` with strengths in ${cleanSkills.join(", ")}`
    : "";

  const goalsPart = cleanGoals.length > 0
    ? ` and currently focused on ${cleanGoals.join(" and ")}`
    : "";

  return `${intro} ${role}${skillsPart}${goalsPart}.`;
}
