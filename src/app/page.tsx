import Link from "next/link";
import {
  Shield,
  Camera,
  FileText,
  Zap,
  Clock,
  Mic,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { ProductDemo } from "@/components/product-demo";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">ClaimScope</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <Zap className="h-3.5 w-3.5" />
            Automated Inspection Reports
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Stop writing reports.
            <span className="block text-primary">Start inspecting.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            ClaimScope turns your site photos and voice notes into professional
            insurance inspection reports in minutes — not hours. Right from your
            phone, right on-site.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              href="/login"
              className="inline-flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-lg font-semibold text-white shadow-md hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              Try Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required. Your first 2 reports are free.
          </p>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-border bg-muted/50 py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-3 divide-x divide-border text-center">
            <div>
              <p className="text-2xl font-extrabold sm:text-3xl">2 min</p>
              <p className="mt-1 text-sm text-muted-foreground">Avg. report time</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold sm:text-3xl">90%</p>
              <p className="mt-1 text-sm text-muted-foreground">Less admin work</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold sm:text-3xl">PDF</p>
              <p className="mt-1 text-sm text-muted-foreground">Ready to submit</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight">
            You didn&apos;t become an assessor to do paperwork
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            You spend all day on-site inspecting properties, then all evening
            writing up reports. Sorting photos, formatting documents, describing
            the same types of damage over and over. It takes 1-3 hours per claim
            — time you could spend on the next job.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Camera, label: "Take 20-50 photos per site", sub: "Then manually sort and label every one" },
            { icon: FileText, label: "Write the same report structure", sub: "Copy-pasting templates, adjusting wording each time" },
            { icon: Clock, label: "1-3 hours of admin per claim", sub: "Evenings and weekends consumed by paperwork" },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-white p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <Icon className="h-6 w-6 text-destructive" />
              </div>
              <p className="font-semibold">{label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-muted/30 py-20 scroll-mt-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Three steps. Two minutes. Done.
            </h2>
            <p className="mt-4 text-muted-foreground">
              ClaimScope handles the report so you can move on to the next site.
            </p>
          </div>
          <ProductDemo />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Built for assessors in the field
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: Zap,
              title: "Automatic damage summaries",
              desc: "Your photos are analyzed to identify damage types, affected materials, and severity automatically.",
            },
            {
              icon: Mic,
              title: "Voice-to-text notes",
              desc: "Dictate observations hands-free. Your voice notes are transcribed while you inspect.",
            },
            {
              icon: FileText,
              title: "Professional PDF reports",
              desc: "Industry-standard format with scope of works, material schedules, and photo evidence — ready to submit.",
            },
            {
              icon: CheckCircle,
              title: "Edit before you send",
              desc: "Review and refine the generated report. Add context, adjust wording, or regenerate sections.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-4 rounded-2xl border border-border bg-white p-6"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="mx-auto max-w-xl px-4 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Finish your next report in 2 minutes
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Sign up free and generate your first inspection report today.
            No credit card required.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-14 items-center gap-2 rounded-2xl bg-white px-8 text-lg font-semibold text-primary shadow-md hover:bg-white/90 transition-all active:scale-[0.98]"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold">ClaimScope</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ClaimScope. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
