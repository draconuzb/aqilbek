/** User-facing Uzbek error messages. Never show raw errors or stack traces to students. */
export const ERRORS = {
  aiUnavailable: "Aqilbek bilan bog‘lanishda muammo yuz berdi. Birozdan keyin qayta urinib ko‘ring.",
  tooLong: "Savolingiz juda uzun. Iltimos, qisqaroq yozing.",
  offline: "Internet aloqasi uzildi.",
  unauthorized: "Bu amal uchun tizimga kirishingiz kerak.",
  dailyLimit: "Bugungi AI foydalanish limitingiz tugadi. Ertaga yana davom etishingiz mumkin.",
  generationLimit: "Bugungi test va mashq tuzish limitingiz tugadi. Ertaga yana davom etishingiz mumkin.",
  tooFast: "Juda tez so‘rov yuboryapsiz. Bir daqiqa kutib, qayta urinib ko‘ring.",
  blocked:
    "Kechirasiz, bu savolga javob bera olmayman. Keling, o‘qish bilan bog‘liq boshqa savol bo‘yicha yordam beray! 📚",
  accountBlocked: "Hisobingiz vaqtincha cheklangan. Batafsil ma’lumot uchun administratorga murojaat qiling.",
  aiDisabled: "Aqilbek hozir texnik xizmatda. Birozdan keyin qayta urinib ko‘ring.",
  invalidInput: "Ma’lumotlar noto‘g‘ri kiritildi. Iltimos, tekshirib qayta urinib ko‘ring.",
  notFound: "Ma’lumot topilmadi.",
  generic: "Nimadir xato ketdi. Iltimos, qayta urinib ko‘ring.",
  guestLimit: "Bepul savollar tugadi. Davom etish uchun ro‘yxatdan o‘ting — bu bepul va bir daqiqa vaqt oladi! 🎓",
  guestBusy: "Hozir mehmonlar juda ko‘p. Bir daqiqadan keyin urinib ko‘ring yoki ro‘yxatdan o‘ting.",
  quizInvalid: "Test tuzishda xatolik bo‘ldi. Iltimos, qayta urinib ko‘ring yoki mavzuni aniqroq yozing.",
} as const;

export type ErrorCode = keyof typeof ERRORS;

/** Thrown on the server for expected failures that map to a friendly message and HTTP status. */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status = 400,
  ) {
    super(ERRORS[code]);
    this.name = "AppError";
  }
}

export function toUserMessage(error: unknown): string {
  return error instanceof AppError ? error.message : ERRORS.generic;
}
