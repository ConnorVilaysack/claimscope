"use client";

import { useEffect, useState, useRef } from "react";
import type { Template } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";

export function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const { templates: data } = await res.json();
        setTemplates(data);
      }
    } catch {
      // handle gracefully
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", uploadName || file.name.replace(/\.pdf$/i, ""));

      const res = await fetch("/api/templates/parse", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { template } = await res.json();
        setTemplates((prev) => [...prev, template]);
        setShowUploadForm(false);
        setUploadName("");
      } else {
        const { error } = await res.json();
        alert(error || "Failed to parse template");
      }
    } catch {
      alert("Failed to upload template");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;

    try {
      const res = await fetch("/api/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      // handle gracefully
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <div>
          <h2 className="text-xl font-bold">Report Templates</h2>
          <p className="text-sm text-muted-foreground">
            Choose a template or upload your own report to match its structure
          </p>
        </div>
      </div>

      {!showUploadForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Have your own report format?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload a previous PDF report and ClaimScope will mirror its section
                  structure in new reports.
                </p>
              </div>
              <Button size="sm" onClick={() => setShowUploadForm(true)}>
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showUploadForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold">
              Upload a previous report to use as a template
            </p>
            <p className="text-xs text-muted-foreground">
              Upload a PDF of a report you&apos;ve previously written. ClaimScope
              will analyze its structure and use it as a template for future
              reports.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Template name (e.g., My Company Format)"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    Analyzing report structure...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Choose PDF
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  setShowUploadForm(false);
                  setUploadName("");
                }}
              >
                Cancel
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {templates.map((template) => {
          const isExpanded = expandedId === template.id;
          const isDefault = template.is_default;
          const sections = template.structure?.sections || [];

          return (
            <Card
              key={template.id}
              className={`transition-shadow ${
                isExpanded ? "shadow-md" : "hover:shadow-sm"
              }`}
            >
              <CardContent className="p-0">
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : template.id)
                  }
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{template.name}</p>
                      {isDefault && (
                        <Badge variant="secondary">Built-in</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {sections.length} sections
                      {template.structure?.tone
                        ? ` · ${template.structure.tone.slice(0, 50)}${template.structure.tone.length > 50 ? "..." : ""}`
                        : ""}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Report Sections
                      </p>
                      <div className="space-y-1">
                        {sections.map(
                          (
                            section: {
                              heading: string;
                              description: string;
                              fields?: string[];
                            },
                            i: number
                          ) => (
                            <div
                              key={i}
                              className="rounded-lg bg-muted/60 px-3 py-2"
                            >
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                  {i + 1}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold">
                                    {section.heading}
                                  </p>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {section.description}
                                  </p>
                                  {section.fields &&
                                    section.fields.length > 0 && (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {section.fields.map((field) => (
                                          <span
                                            key={field}
                                            className="inline-flex items-center gap-0.5 rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border"
                                          >
                                            <Check className="h-2 w-2" />
                                            {field}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {template.structure?.tone && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Writing Style
                        </p>
                        <p className="text-xs text-foreground">
                          {template.structure.tone}
                        </p>
                      </div>
                    )}

                    {template.structure?.formatting_notes && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Formatting
                        </p>
                        <p className="text-xs text-foreground">
                          {template.structure.formatting_notes}
                        </p>
                      </div>
                    )}

                    {!isDefault && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Template
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!showUploadForm && (
        <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 px-4">
          <Button
            size="lg"
            className="w-full shadow-lg"
            onClick={() => setShowUploadForm(true)}
          >
            <Upload className="h-4 w-4" />
            Upload Template PDF
          </Button>
        </div>
      )}
    </div>
  );
}
