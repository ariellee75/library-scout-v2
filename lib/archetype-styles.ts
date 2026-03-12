import {
  Users,
  Hammer,
  BookOpen,
  HeartPulse,
  Briefcase,
  Cpu,
  HandHelping,
  type LucideIcon,
} from "lucide-react"

export interface ArchetypeStyle {
  /** Inline background color for the badge */
  badgeBg: string
  /** Inline text color for the badge */
  badgeText: string
  /** Raw HSL color string for gradient use in inline styles */
  gradientColor: string
  icon: LucideIcon
}

export const ARCHETYPE_STYLES: Record<string, ArchetypeStyle> = {
  Socializers: {
    badgeBg: "hsl(340,60%,55%)",
    badgeText: "#ffffff",
    gradientColor: "hsl(340,60%,90%)",
    icon: Users,
  },
  Makers: {
    badgeBg: "hsl(16,55%,53%)",
    badgeText: "#ffffff",
    gradientColor: "hsl(16,55%,90%)",
    icon: Hammer,
  },
  Learners: {
    badgeBg: "hsl(200,40%,50%)",
    badgeText: "#ffffff",
    gradientColor: "hsl(200,40%,90%)",
    icon: BookOpen,
  },
  "Life Help Seekers": {
    badgeBg: "hsl(160,30%,40%)",
    badgeText: "#ffffff",
    gradientColor: "hsl(160,30%,88%)",
    icon: HandHelping,
  },
  "Career Builders": {
    badgeBg: "hsl(45,70%,50%)",
    badgeText: "#ffffff",
    gradientColor: "hsl(45,70%,90%)",
    icon: Briefcase,
  },
  Techies: {
    badgeBg: "hsl(260,45%,55%)",
    badgeText: "#ffffff",
    gradientColor: "hsl(260,45%,90%)",
    icon: Cpu,
  },
  "Wellness Seekers": {
    badgeBg: "hsl(35,80%,56%)",
    badgeText: "hsl(20,20%,15%)",
    gradientColor: "hsl(35,80%,90%)",
    icon: HeartPulse,
  },
}

export const DEFAULT_STYLE: ArchetypeStyle = {
  badgeBg: "hsl(0,0%,85%)",
  badgeText: "hsl(0,0%,30%)",
  gradientColor: "hsl(0,0%,90%)",
  icon: BookOpen,
}

export function getArchetypeStyle(archetype: string | null | undefined): ArchetypeStyle {
  if (!archetype) return DEFAULT_STYLE
  return ARCHETYPE_STYLES[archetype] || DEFAULT_STYLE
}
