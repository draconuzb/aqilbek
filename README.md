# Aqilbek.uz — Bilimingga aqlli yordamchi

> **UZ:** Maktab o‘quvchilari uchun AI o‘quv yordamchisi: mavzularni sinfga mos qilib tushuntiradi, testlar va mashqlar tuzadi, natijalarni saqlaydi.
>
> **EN:** An AI learning assistant for school students (grades 1–11): grade-appropriate explanations, AI-generated quizzes and practice, saved history — built on Next.js, Supabase and the Mistral AI API.

---

## 1. Imkoniyatlar / Features

| | |
|---|---|
| 🤖 **Aqilbek chat** | Streaming javoblar, to‘xtatish, qayta yaratish, nusxa olish, saqlash, suhbatni nomlash/o‘chirish, sevimlilar, qidiruv |
| 🧠 **AI rejimlari** | Tushuntiruvchi · Uy vazifasi yordamchisi · Konspekt · Erkin suhbat |
| 📝 **Test tuzuvchi** | Structured JSON (json_schema) + zod validatsiya, server tomonda baholash, xatolar tahlili |
| 🧩 **Mashqlar** | Oson/o‘rta/qiyin mashqlar, “Javobni ko‘rish” tugmasi, maslahatlar |
| 📚 **Fanlar** | 11 fan, mavzular ro‘yxati, fan bo‘yicha chat/mashq/test |
| 🕘 **Tarix / ⭐ Saqlanganlar / 👤 Profil** | Qidiruv, filtr, statistika, streak, sozlamalar, light/dark |
| 🛡️ **Admin panel** | Statistika, grafik, foydalanuvchilar (bloklash, rol), fanlar, testlar, hisobotlar, limitlar |
| 🔒 **Xavfsizlik** | Supabase RLS, server-only kalitlar, rate limit, Mistral moderatsiya + `safe_prompt` |

## 2. Talablar / Requirements

- Node.js **20.9+** (22 LTS tavsiya etiladi)
- [Supabase](https://supabase.com) loyihasi (bepul tarif yetarli)
- [Mistral AI](https://console.mistral.ai) API kaliti
- (ixtiyoriy) [Groq](https://console.groq.com) API kaliti — zaxira provayder

## 3. O‘rnatish / Installation

```bash
git clone <repo-url> aqilbek
cd aqilbek
npm install
cp .env.example .env.local   # keyin qiymatlarni to‘ldiring
```

## 4. Supabase sozlash / Supabase setup

1. supabase.com → **New project**.
2. **Project Settings → API**: `Project URL` va `anon public` kalitni nusxalang → `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
3. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (prod: `https://bizdaoson.uz`)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://bizdaoson.uz/auth/callback`
4. (ixtiyoriy) **Authentication → Providers → Google** — Google OAuth client ID/secret kiriting.
5. (ixtiyoriy, MVP uchun tez start) **Authentication → Providers → Email → “Confirm email”** ni o‘chirsangiz, ro‘yxatdan o‘tgan zahoti kirish mumkin.

> ⚠️ `service_role` kaliti bu loyihada **kerak emas** va hech qachon frontendga qo‘yilmasin.

## 5. Ma’lumotlar bazasi migratsiyasi / Database migration

**Variant A — SQL Editor (eng oson):** Supabase → **SQL Editor** → `supabase/migrations/0001_init.sql` faylini to‘liq joylab **Run** bosing.

**Variant B — Supabase CLI:**
```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Migratsiya jadvallar, indekslar, RLS siyosatlari, admin RPC funksiyalari va 11 ta fanni yaratadi.

**Admin tayinlash** (ro‘yxatdan o‘tgandan keyin, SQL Editor’da):
```sql
update public.profiles set role = 'admin' where email = 'siz@misol.uz';
```

## 6. Environment o‘zgaruvchilari / Environment variables

| O‘zgaruvchi | Majburiy | Tavsif |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase URL (build vaqtida kodga kiritiladi) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon (public) kalit |
| `NEXT_PUBLIC_SITE_URL` | | Sayt manzili (`https://bizdaoson.uz`) |
| `MISTRAL_API_KEY` | ✅* | Mistral kaliti — **faqat serverda** |
| `MISTRAL_MODEL` | | Standart: `mistral-large-latest` |
| `MISTRAL_QUIZ_MODEL` | | Test/mashq uchun alohida model |
| `MISTRAL_AGENT_ID` | | Chatni Mistral Agent orqali yuborish (xatoda oddiy modelga qaytadi) |
| `GROQ_API_KEY` / `GROQ_MODEL` | | Zaxira provayder (*Mistral bo‘lmasa shu ishlaydi) |
| `AI_TEMPERATURE`, `AI_MAX_TOKENS`, `AI_TIMEOUT_MS`, `AI_MAX_RETRIES` | | AI sozlamalari |
| `AI_MODERATION_ENABLED`, `AI_MODERATION_THRESHOLD` | | Moderatsiya |
| `LIMIT_CHAT_PER_DAY` | | Kunlik chat limiti (standart 60) |
| `LIMIT_GENERATIONS_PER_DAY` | | Kunlik test+mashq limiti (standart 15) |
| `LIMIT_REQUESTS_PER_MINUTE` | | Daqiqalik limit (standart 8) |

Barcha limitlar bitta joyda — [`src/lib/config.ts`](src/lib/config.ts). Kunlik limitlarni admin `/admin/settings` dan ham o‘zgartira oladi.

## 7. Mistral API

1. https://console.mistral.ai → **API Keys → Create new key**.
2. `.env.local` → `MISTRAL_API_KEY=...`
3. Ishlatiladigan endpointlar: `/v1/chat/completions` (streaming + `json_schema` structured output), `/v1/agents/completions` (agar `MISTRAL_AGENT_ID` bo‘lsa), `/v1/moderations`.

Kod: [`src/lib/ai/mistral.ts`](src/lib/ai/mistral.ts) (retry, timeout, provayder zanjiri), [`src/lib/ai/prompts.ts`](src/lib/ai/prompts.ts) (Aqilbek system prompti), [`src/lib/ai/safety.ts`](src/lib/ai/safety.ts) (moderatsiya).

## 8. Lokal ishga tushirish / Local development

```bash
npm run dev
# http://localhost:3000
```

## 9. Production build

```bash
npm run build
npm start          # yoki: node .next/standalone/server.js
```

## 10. Deploy (VPS: Ubuntu + Docker + Nginx)

Server kichik (1 GB RAM) bo‘lgani uchun build **lokal** qilinadi va tayyor `standalone` paket yuklanadi.

**Bir martalik server sozlash:**
```bash
# serverda
sudo mkdir -p /opt/aqilbek
sudo nano /opt/aqilbek/.env        # MISTRAL_API_KEY, GROQ_API_KEY, LIMIT_* ... (NEXT_PUBLIC_* ham qo‘ying)
sudo chmod 600 /opt/aqilbek/.env
sudo cp nginx-bizdaoson.uz.conf /etc/nginx/sites-available/bizdaoson.uz.conf
sudo ln -s /etc/nginx/sites-available/bizdaoson.uz.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d bizdaoson.uz -d www.bizdaoson.uz
```

**DNS (Cloudflare):** `A  bizdaoson.uz → <server IP>` va `A  www → <server IP>`. SSL/TLS rejimi: **Full (strict)**.

**Har bir yangilanish:**
```bash
SSH_KEY=../bekpro.pem SSH_HOST=ubuntu@<server> ./deploy/deploy.sh
```
Skript build qiladi, paketni yuklaydi va `node:22-alpine` konteynerini `127.0.0.1:3100` da qayta ishga tushiradi.

## Loyiha tuzilishi / Structure

```
src/
  app/
    (auth)/login, register      # kirish va ro‘yxatdan o‘tish
    (app)/dashboard, chat, subjects, quizzes, practice, history, saved, profile, admin
    api/chat                    # NDJSON streaming chat
    api/quizzes/generate        # structured-output test generatsiyasi
    api/practice                # mashq generatsiyasi
    actions/                    # server actions (har biri sessiyani qayta tekshiradi)
  components/                   # UI (shadcn/ui + Base UI)
  lib/
    ai/                         # Mistral klient, promptlar, sxemalar, xavfsizlik, limitlar
    supabase/                   # server/browser klientlar
    config.ts                   # markaziy konfiguratsiya (env validatsiya)
  proxy.ts                      # sessiya yangilash + himoyalangan yo‘nalishlar
supabase/migrations/0001_init.sql
deploy/                         # nginx konfiguratsiya va deploy skripti
```
