import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_URL } from "@/lib/env.public";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext", "cyrillic-ext"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Aqilbek.uz — Bilimingga aqlli yordamchi",
    template: "%s · Aqilbek.uz",
  },
  description:
    "Aqilbek — maktab o‘quvchilari uchun AI yordamchi: mavzularni sodda tushuntiradi, testlar tuzadi va bilimni mustahkamlashga yordam beradi.",
  applicationName: "Aqilbek.uz",
  authors: [{ name: "Abduraxmon Isroilov", url: "https://github.com/draconuzb" }],
  creator: "Abduraxmon Isroilov",
  openGraph: {
    title: "Aqilbek.uz — Bilimingga aqlli yordamchi",
    description: "Savolingni ber. Aqilbek bilan o‘rgan.",
    siteName: "Aqilbek.uz",
    locale: "uz_UZ",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#151826" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" suppressHydrationWarning className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
