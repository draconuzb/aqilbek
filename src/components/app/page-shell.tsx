import { cn } from "@/lib/utils";

/** Standard page frame: responsive gutters, bottom space for the mobile nav bar. */
export function PageShell({
  title,
  description,
  actions,
  className,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-10 lg:pb-12", className)}>
      {(title || actions) && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
          <div>
            {title && <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>}
            {description && <p className="mt-1.5 text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed bg-card/50 px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-3xl">{icon}</div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
