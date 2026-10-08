import type { ChatMode, Difficulty, LanguageId, SavedType } from "@/lib/constants";

export type Profile = {
  id: string;
  first_name: string;
  email: string | null;
  grade: number | null;
  preferred_language: LanguageId;
  purposes: string[];
  role: "student" | "admin";
  onboarded: boolean;
  is_blocked: boolean;
  created_at: string;
};

export type Subject = {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  topics: string[];
  sort_order: number;
  is_active: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  subject_id: number | null;
  mode: ChatMode;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export type QuizContent = {
  title: string;
  subject: string;
  questions: QuizQuestion[];
};

export type QuizRow = {
  id: string;
  title: string;
  topic: string;
  grade: number | null;
  difficulty: Difficulty;
  subject_id: number | null;
  quiz_json: QuizContent;
  created_at: string;
};

/** Quiz as sent to the browser before submission — answers and explanations are withheld. */
export type PublicQuiz = {
  id: string;
  title: string;
  topic: string;
  subject: string;
  difficulty: Difficulty;
  questions: { question: string; options: string[] }[];
};

export type QuizResult = {
  attemptId: string;
  score: number;
  total: number;
  review: {
    question: string;
    options: string[];
    selected: number | null;
    correctAnswer: number;
    explanation: string;
  }[];
};

export type SavedItem = {
  id: string;
  type: SavedType;
  title: string;
  content: string;
  conversation_id: string | null;
  created_at: string;
};

export type PracticeExercise = {
  level: "easy" | "medium" | "hard";
  question: string;
  hint: string;
  answer: string;
  solution: string;
};

export type PracticeSet = {
  title: string;
  exercises: PracticeExercise[];
};

/** Events streamed (as NDJSON) from POST /api/chat to the browser. */
export type ChatStreamEvent =
  | { type: "meta"; conversationId: string; userMessageId: string | null; title: string }
  | { type: "delta"; text: string }
  | { type: "replace"; text: string }
  | { type: "done"; messageId: string | null }
  | { type: "guest"; remaining: number }
  | { type: "error"; message: string };
