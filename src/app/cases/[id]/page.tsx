"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Printer, FileDown, Loader2, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import type { CaseRecord, GeneratedNarrative, Question, QuestionSet, ReportSectionKey, VerificationResult } from "@/lib/domain/types";
import { getCase, saveCase } from "@/lib/store";
import { getCuratedSet } from "@/lib/domain/questionSets";
import { NARRATIVE_KEYS, SECTION_TITLES } from "@/lib/ai/generate";
import { PatientHeaderForm } from "@/components/workspace/PatientHeaderForm";
import { TimelineEditor } from "@/components/workspace/TimelineEditor";
import { HistoryModules } from "@/components/workspace/HistoryModules";
import { PhysicalExamForm } from "@/components/workspace/PhysicalExamForm";
import { ChipQuestion } from "@/components/ChipQuestion";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Markdown } from "@/components/Markdown";
import { downloadDocx } from "@/lib/export/docx";

const STEPS = ["Patient", "History of Illness", "Background", "Exam", "Narrative", "Report"] as const;

export default function Workspace() {
  const params = useParams();
  const id = params.id as string;
  const [c, setC] = useState<CaseRecord | null>(null);
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [nVerify, setNVerify] = useState<VerificationResult | null>(null);
  const [rVerify, setRVerify] = useState<VerificationResult | null>(null);

  useEffect(() => {
    const loaded = getCase(id);
    if (!loaded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setC(loaded);
    const curated = getCuratedSet(loaded.complaintId);
    if (curated) setSet(curated);
    else {
      fetch("/api/question-set", { method: "POST", body: JSON.stringify({ complaintId: loaded.complaintId }) })
        .then((r) => r.json()).then((d) => setSet(d.set)).catch(() => {});
    }
  }, [id]);

  function update(fn: (d: CaseRecord) => void) {
    setC((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      fn(next);
      saveCase(next);
      return next;
    });
  }

  const hpiQuestions: Question[] = useMemo(
    () => set?.groups.find((g) => g.id === "hpi-template")?.questions
      ?? set?.groups.find((g) => g.section === "hpi")?.questions
      ?? [],
    [set]
  );
  const contextQuestions: Question[] = useMemo(
    () => set?.groups.filter((g) => g.section === "hpi" && g.id !== "hpi-template").flatMap((g) => g.questions) ?? [],
    [set]
  );

  async function genNarrative() {
    if (!c || !set) return;
    setBusy("narrative"); setErr(null);
    try {
      const res = await fetch("/api/narrative", { method: "POST", body: JSON.stringify({ case: c, set }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      update((draft) => { draft.narrative = d.narrative; });
      setNVerify(d.verification);
      setStep(4);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  }

  async function genReport() {
    if (!c || !set) return;
    setBusy("report"); setErr(null);
    try {
      const res = await fetch("/api/report", { method: "POST", body: JSON.stringify({ case: c, set }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      update((draft) => { draft.report = d.report; draft.narrative = d.narrative; });
      setRVerify(d.verification);
      setStep(5);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  }

  function setNarrativeSection(key: ReportSectionKey, text: string) {
    update((d) => {
      if (!d.narrative) d.narrative = { sections: {}, model: "edited", createdAt: new Date().toISOString() } as GeneratedNarrative;
      d.narrative.sections[key] = text;
    });
  }

  if (!c) return <p className="text-[var(--muted)]">Loading case… <Link href="/" className="underline">Back</Link></p>;

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <Link href="/" className="btn btn-ghost px-2 py-1 text-sm"><ArrowLeft size={14} /> Cases</Link>
        <div className="text-right">
          <p className="font-bold">{c.complaintLabel}</p>
          <p className="text-xs text-[var(--muted)]">{c.header.initials || "Unnamed"} · {set ? set.source : "loading set"}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="no-print flex flex-wrap gap-1">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i)} className="chip text-xs" data-selected={step === i}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {err && <div className="card border-l-4 border-l-[var(--danger)] p-3 text-sm text-[var(--danger)]">{err}</div>}

      <div className="card p-4">
        {step === 0 && <PatientHeaderForm c={c} update={update} />}
        {step === 1 && (set ? <TimelineEditor c={c} update={update} hpiQuestions={hpiQuestions} /> : <Skeleton />)}
        {step === 2 && (
          <div className="space-y-4">
            {contextQuestions.length > 0 && (
              <details className="card p-0" open>
                <summary className="cursor-pointer px-4 py-3 font-semibold">Complaint-specific context</summary>
                <div className="border-t border-[var(--border)] px-4">
                  {contextQuestions.map((q) => (
                    <ChipQuestion key={q.id} question={q} answer={c.answers.find((a) => a.questionId === q.id)} onChange={(a) => update((d) => { const i = d.answers.findIndex((x) => x.questionId === a.questionId); if (i >= 0) d.answers[i] = a; else d.answers.push(a); })} />
                  ))}
                </div>
              </details>
            )}
            <HistoryModules c={c} update={update} />
          </div>
        )}
        {step === 3 && <PhysicalExamForm c={c} update={update} />}
        {step === 4 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Narrative</h2>
              <button className="btn btn-ghost text-sm" disabled={!!busy} onClick={genNarrative}>
                {busy === "narrative" ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />} {c.narrative ? "Regenerate" : "Generate"}
              </button>
            </div>
            {nVerify && <VerificationBadge v={nVerify} />}
            {!c.narrative && <p className="text-sm text-[var(--muted)]">Generate to convert your chips + key notes into narrative sections. You can edit any section after.</p>}
            {c.narrative && NARRATIVE_KEYS.map((k) => (
              <div key={k}>
                <p className="mb-1 text-xs font-semibold text-[var(--accent)]">{SECTION_TITLES[k]}</p>
                <textarea className="input text-sm" rows={k === "hpi" ? 6 : 2} value={c.narrative!.sections[k] ?? ""} onChange={(e) => setNarrativeSection(k, e.target.value)} />
              </div>
            ))}
          </div>
        )}
        {step === 5 && (
          <div className="space-y-3">
            <div className="no-print flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">Report</h2>
              <div className="flex gap-2">
                <button className="btn btn-ghost text-sm" disabled={!!busy} onClick={genReport}>
                  {busy === "report" ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />} {c.report ? "Regenerate" : "Generate"}
                </button>
                {c.report && <button className="btn btn-ghost text-sm" onClick={() => window.print()}><Printer size={15} /> PDF</button>}
                {c.report && <button className="btn btn-ghost text-sm" onClick={() => downloadDocx(c.report!.markdown, `${c.header.initials || "case"}-report`)}><FileDown size={15} /> DOCX</button>}
              </div>
            </div>
            {rVerify && <div className="no-print"><VerificationBadge v={rVerify} /></div>}
            {c.report ? (
              <div className="print-area"><Markdown source={c.report.markdown} /></div>
            ) : (
              <p className="text-sm text-[var(--muted)]">Generate the full clerkship report from your narrative + exam.</p>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="no-print flex justify-between">
        <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><ArrowLeft size={15} /> Back</button>
        {step < 4 && <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>Next <ArrowRight size={15} /></button>}
        {step === 3 && <button className="btn btn-primary" onClick={genNarrative} disabled={!!busy}>{busy === "narrative" ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />} To narrative</button>}
        {step === 4 && <button className="btn btn-primary" onClick={genReport} disabled={!!busy}>{busy === "report" ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />} To report</button>}
      </div>
    </div>
  );
}

function Skeleton() {
  return <div className="animate-pulse space-y-2"><div className="h-4 w-1/3 rounded bg-[var(--border)]" /><div className="h-20 rounded bg-[var(--border)]" /></div>;
}
