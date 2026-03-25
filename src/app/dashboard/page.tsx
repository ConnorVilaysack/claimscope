"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Claim, ClaimStatus } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { TemplateManager } from "@/components/template-manager";
import { Plus, MapPin, ChevronRight, LogOut, Shield, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

const statusConfig: Record<ClaimStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  draft: { label: "Draft", variant: "secondary" },
  inspecting: { label: "Inspecting", variant: "warning" },
  analyzing: { label: "Analyzing", variant: "default" },
  report_ready: { label: "Report Ready", variant: "success" },
  completed: { label: "Completed", variant: "success" },
};

export default function DashboardPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"claims" | "templates">("claims");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadClaims();
  }, []);

  async function loadClaims() {
    try {
      const { data, error } = await supabase
        .from("claims")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setClaims(data || []);
    } catch {
      // Supabase not yet configured
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold">ClaimScope</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted transition-colors"
          >
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="px-4 py-5 space-y-4">
        {/* Tab switcher */}
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          <button
            onClick={() => setActiveTab("claims")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
              activeTab === "claims"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="h-4 w-4" />
            Claims
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
              activeTab === "templates"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            Templates
          </button>
        </div>

        {activeTab === "templates" ? (
          <TemplateManager />
        ) : (
        <>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Your Claims</h2>
            <p className="text-sm text-muted-foreground">
              {claims.length} inspection{claims.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/claims/new">
            <Button size="default">
              <Plus className="h-5 w-5" />
              New Claim
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : claims.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <MapPin className="h-7 w-7 text-primary" />
              </div>
              <p className="font-semibold text-lg">No claims yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-5">
                Start your first inspection
              </p>
              <Link href="/claims/new">
                <Button size="lg">
                  <Plus className="h-5 w-5" />
                  New Claim
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => {
              const config = statusConfig[claim.status as ClaimStatus] || statusConfig.draft;
              const href =
                claim.status === "report_ready" || claim.status === "completed"
                  ? `/claims/${claim.id}/report`
                  : claim.status === "draft"
                  ? `/claims/${claim.id}/inspection`
                  : `/claims/${claim.id}/inspection`;
              return (
                <Link key={claim.id} href={href}>
                  <Card className="hover:shadow-md transition-shadow active:scale-[0.99] cursor-pointer">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{claim.address}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={config.variant}>{config.label}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(claim.created_at)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}
