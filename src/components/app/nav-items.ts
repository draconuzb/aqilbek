import {
  BookmarkIcon,
  BookOpenIcon,
  BotMessageSquareIcon,
  ClipboardListIcon,
  HistoryIcon,
  HouseIcon,
  ShieldIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; emoji: string };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Bosh sahifa", icon: HouseIcon, emoji: "🏠" },
  { href: "/chat", label: "Aqilbek", icon: BotMessageSquareIcon, emoji: "🤖" },
  { href: "/subjects", label: "Fanlar", icon: BookOpenIcon, emoji: "📚" },
  { href: "/quizzes", label: "Testlar", icon: ClipboardListIcon, emoji: "📝" },
  { href: "/history", label: "Tarix", icon: HistoryIcon, emoji: "🕘" },
  { href: "/saved", label: "Saqlanganlar", icon: BookmarkIcon, emoji: "⭐" },
  { href: "/profile", label: "Profil", icon: UserIcon, emoji: "👤" },
];

export const ADMIN_ITEM: NavItem = { href: "/admin", label: "Admin panel", icon: ShieldIcon, emoji: "🛡️" };

/** Shown in the mobile bottom bar; the rest live in the mobile menu. */
export const BOTTOM_NAV = ["/dashboard", "/subjects", "/chat", "/quizzes", "/profile"];

export function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
