import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { ProductDemo } from "@/components/product-demo";

export default function DemoPage() {
  return (
    <div className="min-h-dvh bg-white">
      <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">ClaimScope</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-semibold text-primary hover:text-primary/80"
          >
            Sign in
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="mx-auto max-w-2xl text-center mb-10">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Interactive demo
          </h1>
          <p className="mt-2 text-muted-foreground">
            No account needed. This is a guided preview — sign in to run real
            inspections and reports.
          </p>
        </div>
        <ProductDemo />
      </div>
    </div>
  );
}
