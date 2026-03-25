"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  action,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  action?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted active:scale-95 transition-all -ml-2"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
