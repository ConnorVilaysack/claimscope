"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Mic,
  FileText,
  Check,
  Download,
  Square,
  Pencil,
  Wifi,
  Battery,
  Signal,
} from "lucide-react";

const STEP_DURATION = 5000;

const STEPS = [
  { icon: Camera, title: "Upload Photos", label: "Step 1" },
  { icon: Mic, title: "Voice Notes", label: "Step 2" },
  { icon: FileText, title: "Generate Report", label: "Step 3" },
  { icon: Download, title: "Edit & Download", label: "Step 4" },
];

const DEMO_PHOTOS = [
  { src: "/demo/roof-damage.png", label: "Roof Damage" },
  { src: "/demo/structural-damage.png", label: "Structural" },
  { src: "/demo/vehicle-damage.png", label: "Vehicle Impact" },
  { src: "/demo/water-stain.png", label: "Water Stain" },
];

const TRANSCRIPT_TEXT =
  "Water damage visible on the north-facing wall. Approximately 3 square metres of plasterboard affected. Staining suggests a slow leak from the upstairs bathroom.";

function IPhoneStatusBar() {
  return (
    <div className="relative flex h-[44px] items-center justify-between px-6 bg-[#f8f8f8]">
      <span className="text-[12px] font-semibold text-black">9:41</span>
      <div className="absolute left-1/2 top-[12px] -translate-x-1/2 h-[22px] w-[90px] rounded-full bg-black" />
      <div className="flex items-center gap-[5px]">
        <Signal className="h-[11px] w-[11px] text-black" />
        <Wifi className="h-[11px] w-[11px] text-black" />
        <Battery className="h-[11px] w-[11px] text-black" />
      </div>
    </div>
  );
}

function PhotoUploadStage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <Camera className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-black">Site Photos</span>
        <motion.span
          className="ml-auto text-[10px] text-gray-500 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          4 added
        </motion.span>
      </div>

      <div className="grid grid-cols-2 gap-2 px-3 flex-1">
        {DEMO_PHOTOS.map((photo, i) => (
          <motion.div
            key={photo.label}
            className="relative rounded-xl overflow-hidden aspect-square"
            initial={{ opacity: 0, scale: 0.72 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.2 + i * 0.22,
              duration: 0.35,
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
          >
            <img
              src={photo.src}
              alt={photo.label}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            <motion.div
              className="absolute bottom-1.5 left-1.5 right-1.5"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.2 }}
            >
              <span className="text-[9px] font-semibold text-white drop-shadow-md">
                {photo.label}
              </span>
            </motion.div>
            <motion.div
              className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#34c759] text-white shadow-sm"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.6 + i * 0.2,
                type: "spring",
                stiffness: 300,
              }}
            >
              <Check className="h-3 w-3" />
            </motion.div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mx-3 mb-3 mt-2 flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 py-2.5 text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0.7] }}
        transition={{ delay: 1.8, duration: 0.5 }}
      >
        <Camera className="h-3.5 w-3.5" />
        <span className="text-[11px] font-medium">Add more photos</span>
      </motion.div>
    </div>
  );
}

function VoiceNotesStage() {
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCharCount((prev) => {
        if (prev >= TRANSCRIPT_TEXT.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 2;
      });
    }, 25);
    return () => clearInterval(interval);
  }, []);

  const isRecording = charCount < TRANSCRIPT_TEXT.length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <Mic className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-black">Voice Note</span>
      </div>

      <div className="px-3 mb-2">
        <motion.div
          className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ${
            isRecording
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-700"
          }`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isRecording ? (
            <>
              <motion.div
                className="h-2.5 w-2.5 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              <Square className="h-3 w-3" />
              Recording...
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              Transcribed
            </>
          )}
        </motion.div>
      </div>

      {isRecording && (
        <div className="flex items-center justify-center gap-[3px] px-3 h-12">
          {Array.from({ length: 26 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-[3px] rounded-full bg-red-400"
              animate={{
                height: [
                  8,
                  4 + Math.random() * 22,
                  8,
                  4 + Math.random() * 16,
                  8,
                ],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.6 + Math.random() * 0.4,
                delay: i * 0.03,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      <div className="px-3 mt-2 flex-1">
        <motion.div
          className="rounded-xl bg-gray-100 p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <p className="text-[11px] leading-relaxed text-black font-medium">
            &ldquo;{TRANSCRIPT_TEXT.slice(0, charCount)}
            {isRecording && (
              <motion.span
                className="inline-block w-[2px] h-3 bg-black ml-[1px] align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
              />
            )}
            {!isRecording && <>&rdquo;</>}
          </p>
        </motion.div>
      </div>

      {!isRecording && (
        <motion.div
          className="mx-3 mb-3 mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2.5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Check className="h-3.5 w-3.5 text-[#34c759]" />
          <span className="text-[11px] font-medium text-gray-500">
            Note saved
          </span>
        </motion.div>
      )}
    </div>
  );
}

function ReportMock({ variant }: { variant: "base" | "edited" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="border-b-[3px] border-primary px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-extrabold text-primary tracking-tight">
              Your Brand
            </p>
            <p className="text-[8px] text-gray-500 font-medium mt-0.5">
              Property Damage Inspection Report
            </p>
          </div>
          <div className="text-right">
            <p className="text-[7px] text-gray-400 uppercase tracking-wider">
              Ref #
            </p>
            <p className="text-[9px] font-bold text-black">INS-000123</p>
          </div>
        </div>
      </div>

      <div className="px-3 py-2 space-y-3">
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 border-b border-gray-100 pb-2">
          {[
            ["Insurer", "Example Insurance Co."],
            ["Insurer Ref #", "EX-2026-10482"],
            ["Property Owner", "Jordan Smith"],
            ["Property Address", "18 Coastal Ave, Brisbane"],
          ].map(([k, v]) => (
            <div key={k} className="py-0.5">
              <p className="text-[6px] text-gray-400 uppercase tracking-widest font-semibold">
                {k}
              </p>
              <p className="text-[8px] font-semibold text-black">{v}</p>
            </div>
          ))}
        </div>

        <div className="border-b border-gray-100 pb-2">
          <p className="text-[8px] font-bold text-primary uppercase tracking-wider mb-1">
            Claim Information
          </p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <p className="text-[7px]">
              <span className="text-gray-400">Event:</span>{" "}
              <span className="font-semibold text-black">Storm Damage</span>
            </p>
            <p className="text-[7px]">
              <span className="text-gray-400">Sum Insured:</span>{" "}
              <span className="font-semibold text-black">$901,258</span>
            </p>
            <p className="text-[7px]">
              <span className="text-gray-400">Category:</span>{" "}
              <span className="font-semibold text-black">CAT-C</span>
            </p>
            <p className="text-[7px]">
              <span className="text-gray-400">Inspection:</span>{" "}
              <span className="font-semibold text-black">Non-Invasive</span>
            </p>
          </div>
        </div>

        <div className="border-b border-gray-100 pb-2">
          <p className="text-[8px] font-bold text-primary uppercase tracking-wider mb-1">
            Inspection Observations
          </p>
          <div className="space-y-1">
            <p className="text-[7px] leading-relaxed text-gray-700">
              Water ingress staining to front &amp; rear eaves linings.
              Atmospheric mould evident on affected sections.
            </p>
            <p className="text-[7px] leading-relaxed text-gray-700">
              Rumpus room plasterboard ceiling and cornice damaged consistent
              with water ingress over time.
            </p>
          </div>
        </div>

        <div className="border-b border-gray-100 pb-2">
          <p className="text-[8px] font-bold text-primary uppercase tracking-wider mb-1.5">
            Photo Evidence
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {DEMO_PHOTOS.map((photo) => (
              <div
                key={photo.label}
                className="relative rounded-lg overflow-hidden"
              >
                <img
                  src={photo.src}
                  alt={photo.label}
                  className="h-[52px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1">
                  <p className="text-[6px] font-bold text-white drop-shadow">
                    {photo.label}
                  </p>
                </div>
                <div className="absolute top-1 right-1 rounded bg-red-500/90 px-1 py-0.5">
                  <p className="text-[5px] font-bold text-white uppercase">
                    Damage
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-gray-100 pb-2">
          <p className="text-[8px] font-bold text-primary uppercase tracking-wider mb-1">
            Damage Assessment
          </p>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-3 bg-primary/10">
              {["Area", "Damage Type", "Severity"].map((h) => (
                <p
                  key={h}
                  className="text-[6px] font-bold text-primary px-1.5 py-1 uppercase tracking-wider"
                >
                  {h}
                </p>
              ))}
            </div>
            {[
              ["Eaves lining", "Water ingress", "High"],
              ["Rumpus ceiling", "Water damage", "High"],
              ["Roof tiles", "Wear / damage", "Moderate"],
              ["Gutters / valleys", "Debris blockage", "Moderate"],
            ].map(([area, type, sev], i) => (
              <div
                key={area}
                className={`grid grid-cols-3 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <p className="text-[7px] font-semibold text-black px-1.5 py-1">
                  {area}
                </p>
                <p className="text-[7px] text-gray-600 px-1.5 py-1">
                  {type}
                </p>
                <p className="text-[7px] px-1.5 py-1">
                  <span
                    className={`inline-block rounded px-1 py-0.5 text-[5px] font-bold uppercase ${
                      sev === "High"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {sev}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pb-2">
          <p className="text-[8px] font-bold text-primary uppercase tracking-wider mb-1">
            {variant === "edited"
              ? "Conclusion & Recommendation (Edited)"
              : "Conclusion & Recommendation"}
          </p>
          <div className="rounded bg-blue-50 border border-blue-200 px-2 py-1.5">
            <p className="text-[7px] font-bold text-blue-800">
              Policy Recommendation: {variant === "edited" ? "Unsure" : "Liability Settlement"}
            </p>
            <p className="text-[6px] text-blue-700 mt-0.5 leading-relaxed">
              {variant === "edited"
                ? "Prioritise make-safe works for drainage reinstatement, then complete warrantable repairs."
                : "Resultant damage does not respond to policy coverage; recommend settlement directly to insured."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportStage() {
  const [phase, setPhase] = useState<"analyzing" | "generating" | "done">(
    "analyzing"
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("generating"), 550);
    const t2 = setTimeout(() => setPhase("done"), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (phase !== "done") return;
    const el = scrollRef.current;
    if (!el) return;

    let raf = 0;
    let pos = 0;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const speed = 0.95;

    const tick = () => {
      pos += speed;
      if (pos >= maxScroll) pos = 0;
      el.scrollTop = pos;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const progressWidth =
    phase === "analyzing" ? "30%" : phase === "generating" ? "70%" : "100%";

  const statusText =
    phase === "analyzing"
      ? "Analyzing photos..."
      : phase === "generating"
        ? "Generating report..."
        : "Report ready — previewing...";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-black">Inspection Report</span>
      </div>

      <div className="px-3 mb-2 space-y-1">
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: progressWidth }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
        <motion.p
          className="text-[10px] font-medium text-gray-500 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {statusText}
        </motion.p>
      </div>

      <motion.div
        className="mx-3 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: phase === "done" ? 1 : 0.25,
          y: phase === "done" ? 0 : 10,
        }}
        transition={{ duration: 0.45 }}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
            <p className="text-[12px] font-semibold text-black">PDF Preview</p>
            <p className="text-[10px] text-gray-500">This is exactly what downloads.</p>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-auto p-2">
            <ReportMock variant="base" />

            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-[11px] font-semibold text-black mb-2">
                Photo Evidence (4)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_PHOTOS.map((photo) => (
                  <div key={photo.label} className="space-y-1">
                    <div className="aspect-[4/3] overflow-hidden rounded-lg">
                      <img
                        src={photo.src}
                        alt={photo.label}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="text-[9px] text-gray-500 text-center">
                      {photo.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function EditDownloadStage() {
  const [phase, setPhase] = useState<"editing" | "saving" | "done">("editing");
  const [typed, setTyped] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const typeText =
      "Water ingress findings and scope of works updated for clearer insurer submission.";
    const interval = setInterval(() => {
      setTyped((n) => {
        if (n >= typeText.length) {
          clearInterval(interval);
          return n;
        }
        return n + 2;
      });
    }, 14);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (phase !== "editing") return;
    if (typed < 60) return;
    const t = setTimeout(() => setPhase("saving"), 650);
    return () => clearTimeout(t);
  }, [phase, typed]);

  useEffect(() => {
    if (phase !== "saving") return;
    const t = setTimeout(() => setPhase("done"), 1200);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    const el = scrollRef.current;
    if (!el) return;

    let raf = 0;
    let pos = 0;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const speed = 1.0;

    const tick = () => {
      pos += speed;
      if (pos >= maxScroll) pos = 0;
      el.scrollTop = pos;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const editingText =
    "Water ingress findings and scope of works updated for clearer insurer submission.";

  return (
    <div className="flex flex-col h-full">
      {phase === "editing" && (
        <div className="flex flex-col h-full px-1.5">
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            <Pencil className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Editing Report</span>
          </div>

          <div className="mx-3 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex-1">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-muted-foreground">
                Update sections you want insurers to focus on
              </p>
            </div>
            <div className="p-3">
              <div className="min-h-[220px] rounded-lg bg-gray-50 border border-gray-100 p-2.5 font-mono text-[10px] text-gray-800 whitespace-pre-wrap">
                {editingText.slice(0, typed)}
                <span className="inline-block w-[1px] h-[12px] bg-primary ml-[1px] align-middle" />
              </div>
            </div>
          </div>

          <div className="mx-3 mt-2 mb-2 flex gap-2">
            <button
              onClick={() => setPhase("done")}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-[11px] font-semibold text-gray-700"
            >
              Cancel
            </button>
            <button
              className="flex-1 rounded-xl bg-primary py-2.5 text-[11px] font-semibold text-white"
              disabled
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {phase !== "editing" && (
        <>
          <motion.div
            className="mx-3 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            <div ref={scrollRef} className="h-full overflow-auto p-2">
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
                  <p className="text-[12px] font-semibold text-black">PDF Preview</p>
                  <p className="text-[10px] text-gray-500">This is exactly what downloads.</p>
                </div>
                <div className="p-2">
                  <ReportMock variant="edited" />

                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-black mb-2">
                      Photo Evidence (4)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {DEMO_PHOTOS.map((photo) => (
                        <div key={photo.label} className="space-y-1">
                          <div className="aspect-[4/3] overflow-hidden rounded-lg">
                            <img
                              src={photo.src}
                              alt={photo.label}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <p className="text-[9px] text-gray-500 text-center">
                            {photo.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {phase === "saving" && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-gray-700">
                    Applying edits...
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-[3px] rounded-full bg-primary"
                        animate={{ height: [6, 18, 6] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.9,
                          delay: i * 0.05,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {phase === "done" && (
              <div className="absolute top-2 left-2 right-2 pointer-events-none flex items-center justify-between">
                <div className="rounded-full bg-black/10 px-2 py-1">
                  <p className="text-[9px] font-semibold text-gray-800">
                    Updates applied
                  </p>
                </div>
                <motion.div
                  className="rounded-full bg-black/10 px-2 py-1"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.9 }}
                >
                  <p className="text-[9px] font-semibold text-gray-800">
                    Ready to export
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>

          <motion.div
            className="mx-3 mb-3 mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-white shadow-md"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: phase === "done" ? 1 : 0.35, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 16,
            }}
          >
            <Download className="h-4 w-4" />
            <span className="text-[11px] font-bold">Download PDF</span>
          </motion.div>
        </>
      )}
    </div>
  );
}

export function ProductDemo() {
  const [currentStep, setCurrentStep] = useState(0);

  const advance = useCallback(() => {
    setCurrentStep((prev) => (prev + 1) % STEPS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(advance, STEP_DURATION);
    return () => clearInterval(timer);
  }, [advance]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative mx-auto" style={{ width: 300 }}>
        <div
          className="overflow-hidden shadow-[0_25px_80px_-15px_rgba(0,0,0,0.25)]"
          style={{
            borderRadius: 44,
            border: "4px solid #1a1a1a",
            background: "#000",
          }}
        >
          <div
            className="overflow-hidden bg-[#f2f2f7]"
            style={{ borderRadius: 40 }}
          >
            <IPhoneStatusBar />

            <div className="flex items-center gap-2 border-b border-gray-200 bg-[#f8f8f8] px-4 py-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary">
                <div className="h-3 w-3 rounded-sm bg-white" />
              </div>
              <span className="text-[13px] font-bold text-black">
                Your Brand
              </span>
            </div>

            <div className="h-[480px] overflow-hidden bg-[#f2f2f7]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  className="h-full"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 0 && <PhotoUploadStage />}
                  {currentStep === 1 && <VoiceNotesStage />}
                  {currentStep === 2 && <ReportStage />}
                  {currentStep === 3 && <EditDownloadStage />}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-center bg-[#f2f2f7] pb-2 pt-1.5">
              <div className="h-[5px] w-[120px] rounded-full bg-black/20" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className="group flex items-center gap-1.5"
            >
              <motion.div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  i === currentStep
                    ? "bg-primary text-white"
                    : i < currentStep
                      ? "bg-[#34c759] text-white"
                      : "bg-gray-200 text-gray-400"
                }`}
                animate={i === currentStep ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
              </motion.div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-5 sm:w-8 rounded-full transition-colors ${
                    i < currentStep ? "bg-[#34c759]" : "bg-gray-200"
                  }`}
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="text-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-lg font-bold">{STEPS[currentStep].title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {currentStep === 0 &&
                "Take photos of each room and damage area."}
              {currentStep === 1 &&
                "Dictate observations — automatically transcribed."}
              {currentStep === 2 &&
                "A full insurance inspection report, auto-generated."}
              {currentStep === 3 &&
                "Review findings, edit sections, and download the final PDF."}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
