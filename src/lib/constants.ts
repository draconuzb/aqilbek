// Values shared by client and server. No secrets here.

export const BRAND = {
  name: "Aqilbek.uz",
  assistant: "Aqilbek",
  slogan: "Bilimingga aqlli yordamchi.",
  tagline: "Savolingni ber. Aqilbek bilan o‘rgan.",
} as const;

export const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

/** Mirrors the seeded `subjects` table; used where a DB round-trip is unnecessary (forms, onboarding). */
export const SUBJECT_OPTIONS = [
  { slug: "matematika", name: "Matematika", icon: "📐" },
  { slug: "fizika", name: "Fizika", icon: "⚛️" },
  { slug: "kimyo", name: "Kimyo", icon: "🧪" },
  { slug: "biologiya", name: "Biologiya", icon: "🧬" },
  { slug: "informatika", name: "Informatika", icon: "💻" },
  { slug: "ona-tili", name: "Ona tili", icon: "📖" },
  { slug: "adabiyot", name: "Adabiyot", icon: "📚" },
  { slug: "tarix", name: "Tarix", icon: "🏛️" },
  { slug: "geografiya", name: "Geografiya", icon: "🌍" },
  { slug: "ingliz-tili", name: "Ingliz tili", icon: "🇬🇧" },
  { slug: "rus-tili", name: "Rus tili", icon: "🇷🇺" },
] as const;

export const OTHER_SUBJECT = { slug: "boshqa", name: "Boshqa", icon: "✨" } as const;

export const PURPOSES = [
  { id: "understand", label: "Mavzuni tushunish", icon: "💡" },
  { id: "homework", label: "Uy vazifasiga yordam", icon: "🏠" },
  { id: "practice", label: "Test ishlash", icon: "✅" },
  { id: "create_tests", label: "Test tuzish", icon: "📝" },
  { id: "exam", label: "Imtihonga tayyorlanish", icon: "🎯" },
  { id: "general", label: "Umumiy savollar", icon: "💬" },
] as const;

export type PurposeId = (typeof PURPOSES)[number]["id"];

export const LANGUAGES = [
  { id: "auto", label: "Avtomatik (savol tiliga qarab)" },
  { id: "uz", label: "O‘zbekcha" },
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

export const CHAT_MODES = [
  {
    id: "explain",
    title: "Tushuntiruvchi",
    description: "Mavzuni sodda va bosqichma-bosqich tushuntiradi",
    icon: "💡",
  },
  {
    id: "homework",
    title: "Uy vazifasi yordamchisi",
    description: "Masalani yechish yo‘lini o‘rgatadi",
    icon: "🏠",
  },
  {
    id: "summary",
    title: "Konspekt",
    description: "Mavzu bo‘yicha qisqa konspekt tuzadi",
    icon: "🗒️",
  },
  {
    id: "general",
    title: "Erkin suhbat",
    description: "Har qanday o‘quv savoli",
    icon: "💬",
  },
] as const;

export type ChatMode = (typeof CHAT_MODES)[number]["id"];

export const DIFFICULTIES = [
  { id: "easy", label: "Oson" },
  { id: "medium", label: "O‘rta" },
  { id: "hard", label: "Qiyin" },
] as const;

export type Difficulty = (typeof DIFFICULTIES)[number]["id"];

export const SAVED_TYPES = [
  { id: "explanation", label: "Tushuntirishlar", icon: "💡" },
  { id: "question", label: "Savollar", icon: "❓" },
  { id: "note", label: "Konspektlar", icon: "🗒️" },
] as const;

export type SavedType = (typeof SAVED_TYPES)[number]["id"];

/** Input limits enforced on both client (UX) and server (security). */
export const LIMITS = {
  messageMaxChars: 4000,
  titleMaxChars: 80,
  topicMaxChars: 150,
  quizMinQuestions: 3,
  quizMaxQuestions: 20,
  practiceMaxPerLevel: 6,
  firstNameMaxChars: 40,
  noteMaxChars: 20000,
  historyContextMessages: 20,
} as const;

export const QUICK_PROMPTS = [
  "Shu mavzuni sodda tushuntir",
  "Menga 10 ta test tuz",
  "Misollar bilan tushuntir",
  "Qisqa qilib ber",
] as const;

export const WELCOME_SUBJECTS = [
  { slug: "matematika", label: "📐 Matematika" },
  { slug: "informatika", label: "💻 Informatika" },
  { slug: "ingliz-tili", label: "🇬🇧 Ingliz tili" },
  { slug: "ona-tili", label: "📖 Ona tili" },
  { slug: "tarix", label: "🌍 Tarix" },
  { slug: "biologiya", label: "🧪 Biologiya" },
] as const;

export function subjectBySlug(slug: string | null | undefined) {
  return SUBJECT_OPTIONS.find((s) => s.slug === slug);
}
