"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { MapPin, FileText, ArrowRight } from "lucide-react";

export default function NewClaimPage() {
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Ensure user profile exists (idempotent upsert)
      await supabase
        .from("users")
        .upsert({ id: user.id, email: user.email! }, { onConflict: "id" });

      const { data, error: dbError } = await supabase
        .from("claims")
        .insert({
          user_id: user.id,
          address: address.trim(),
          notes: notes.trim() || null,
          status: "inspecting",
        })
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);
      router.push(`/claims/${data.id}/inspection`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create claim";
      console.error("Create claim error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <PageHeader title="New Claim" showBack />

      <main className="mx-auto max-w-lg px-4 py-6">
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-primary" />
              Property Address
            </label>
            <Input
              placeholder="123 Main St, City, State"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              Initial Notes (optional)
            </label>
            <Textarea
              placeholder="Brief description of the damage..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <Button type="submit" size="xl" className="w-full" disabled={loading}>
            {loading ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <>
                Start Inspection
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
