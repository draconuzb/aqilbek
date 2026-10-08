import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70svh] flex-1 flex-col items-center justify-center px-6 text-center">
      <LogoMark className="size-14" />
      <p className="mt-5 text-sm font-semibold text-primary">404</p>
      <h1 className="mt-1 text-2xl font-bold">Sahifa topilmadi</h1>
      <p className="mt-2 max-w-md text-muted-foreground">Bu sahifa mavjud emas yoki o‘chirilgan bo‘lishi mumkin.</p>
      <Link href="/" className={`${buttonVariants()} mt-6`}>
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
