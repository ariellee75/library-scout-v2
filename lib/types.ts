export interface LibraryClass {
  id: number
  class_name: string
  description: string
  date: string
  time: string
  link: string
  archetype: string
  main_category: string
  sub_category: string
  format: string
  location: string
  is_hot: boolean
  is_staff_pick: boolean
  save_count: number
  created_at: string
}

export interface Profile {
  id: string
  username: string
  email: string
  is_admin: boolean
  created_at: string
}

export interface SavedClass {
  id: number
  user_id: string
  class_id: number
  created_at: string
  classes?: LibraryClass
}

export interface UserInterest {
  id: number
  user_id: string
  interest: string
  created_at: string
}

export interface Feedback {
  id: number
  user_id: string
  class_id: number
  rating: number
  comment: string
  created_at: string
  profiles?: { username: string } | null
}

export interface Report {
  id: number
  user_id: string
  class_id: number
  reason: string
  details: string
  created_at: string
}

// ── Archetypes with human descriptions ──
export const ARCHETYPES = [
  {
    value: "Life Help Seekers",
    description:
      "You're looking for help with important life stuff -- things like paperwork, rules, or systems that affect your day-to-day life.",
  },
  {
    value: "Career Builders",
    description:
      "You want help with your job, your income, or figuring out what's next for your work life.",
  },
  {
    value: "Techies",
    description:
      "You're interested in technology or want to learn how to use, build, or understand digital tools better.",
  },
  {
    value: "Learners",
    description:
      "You enjoy learning new things and understanding how the world works, just because you're curious.",
  },
  {
    value: "Makers",
    description:
      "You want to create something with your hands or express yourself creatively.",
  },
  {
    value: "Wellness Seekers",
    description:
      "You're looking for ways to feel better in your body, mind, or overall well-being.",
  },
  {
    value: "Socializers",
    description:
      "You want to spend time with other people, meet new folks, or do something social and fun together.",
  },
] as const

export const ARCHETYPE_VALUES = ARCHETYPES.map((a) => a.value)

// ── Main Categories with descriptions ──
export const MAIN_CATEGORIES = [
  {
    value: "Money & Taxes",
    description: "Classes related to personal or small business finances and tax topics.",
  },
  {
    value: "Immigration & Citizenship",
    description: "Classes related to immigration processes, citizenship, and immigrant rights.",
  },
  {
    value: "Housing & Tenant Rights",
    description: "Classes related to housing stability, renting, and tenant protections.",
  },
  {
    value: "Legal Help & Rights",
    description: "Classes related to understanding legal rights and legal processes.",
  },
  {
    value: "Jobs & Careers",
    description: "Classes related to employment, job readiness, and career development.",
  },
  {
    value: "Business & Entrepreneurship",
    description: "Classes related to starting, running, or growing a business or freelance work.",
  },
  {
    value: "Technology & Coding",
    description: "Classes related to technology skills, computers, and digital tools.",
  },
  {
    value: "Art & Visual Creativity",
    description: "Classes related to visual art and creative expression.",
  },
  {
    value: "Writing & Literature",
    description: "Classes related to writing, reading, and literary discussion.",
  },
  {
    value: "Crafts, Sewing & Fashion",
    description: "Classes related to hands-on crafts and fiber-based making.",
  },
  {
    value: "Languages",
    description: "Classes related to learning or practicing languages.",
  },
  {
    value: "Health, Wellness & Movement",
    description: "Classes related to physical, mental, or emotional well-being.",
  },
  {
    value: "Culture, History & Talks",
    description: "Classes related to cultural topics, history, and educational talks.",
  },
  {
    value: "Archives, Research & Genealogy",
    description: "Classes related to research skills, archives, and historical records.",
  },
  {
    value: "Family & Caregiving",
    description: "Classes related to family life, parenting, and caregiving.",
  },
] as const

export const MAIN_CATEGORY_VALUES = MAIN_CATEGORIES.map((c) => c.value)

// ── Sub-categories mapped to main categories ──
export const SUB_CATEGORY_MAP: Record<string, string[]> = {
  "Money & Taxes": ["Taxes & Filing", "Budgeting & Money Management", "Credit, Debt & Loans"],
  "Immigration & Citizenship": ["Citizenship Test Prep", "Immigration Help Clinics"],
  "Housing & Tenant Rights": ["Tenant Rights & Housing Law", "Housing Court & Eviction Help"],
  "Legal Help & Rights": ["Legal Rights & Clinics", "Small Claims & Civil Court"],
  "Jobs & Careers": ["Job Search & Applications", "Resumes & Interviews", "Career Change & Planning"],
  "Business & Entrepreneurship": ["Entrepreneurship & Freelancing", "Business Finance & Operations"],
  "Technology & Coding": [
    "Computer Basics",
    "Coding & Programming",
    "Web & App Building",
    "Digital Media Tools",
    "Audio Software & DAWs",
  ],
  "Art & Visual Creativity": [
    "Drawing & Painting",
    "Calligraphy & Lettering",
    "Creative Journaling (Visual)",
    "DJing Basics",
    "Music Production",
    "Sound & Audio Production",
  ],
  "Crafts, Sewing & Fashion": [
    "Paper Arts & Origami",
    "Sewing & Fashion Basics",
    "Fiber Arts & Stitching",
  ],
  "Writing & Literature": ["Creative Writing", "Poetry & Spoken Word"],
  Languages: ["Language Basics", "Language Conversation Groups"],
  "Health, Wellness & Movement": ["Yoga & Movement", "Meditation & Mindfulness"],
  "Culture, History & Talks": ["History & Cultural Talks", "Media Literacy"],
  "Archives, Research & Genealogy": ["Genealogy & Family History", "Archives & Research Skills"],
  "Family & Caregiving": ["Parenting & Caregiving"],
  "Games, Film & Social Clubs": ["Games & Chess Clubs", "Film Clubs & Screenings"],
}

// ── Time preferences ──
export const TIME_PREFS = [
  { value: "morning", label: "Morning", description: "Before 12pm" },
  { value: "lunch", label: "Lunch Time", description: "11am - 2pm" },
  { value: "afternoon", label: "Afternoon", description: "12pm - 5pm" },
  { value: "after_work", label: "After 5 PM", description: "5pm and later" },
] as const

export const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "this_week" },
  { label: "On the Weekend", value: "weekend" },
  { label: "Next Week", value: "next_week" },
] as const

export const REPORT_REASONS = [
  "Broken link",
  "Wrong date or time",
  "Wrong location",
  "Event cancelled",
  "Inaccurate description",
  "Other",
] as const

export const FEEDBACK_MAX_CHARS = 500
