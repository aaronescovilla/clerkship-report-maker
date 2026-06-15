"use client";
import type { Answer, QuestionGroup } from "@/lib/domain/types";
import { STANDARD_MODULES } from "@/lib/domain/standardModules";
import { ChipQuestion } from "@/components/ChipQuestion";
import type { WorkspaceProps } from "./types";

export function HistoryModules({ c, update }: WorkspaceProps) {
  function setAnswer(a: Answer) {
    update((d) => {
      const idx = d.answers.findIndex((x) => x.questionId === a.questionId);
      if (idx >= 0) d.answers[idx] = a; else d.answers.push(a);
    });
  }

  function answeredCount(g: QuestionGroup): number {
    return g.questions.filter((q) => {
      const a = c.answers.find((x) => x.questionId === q.id);
      return a && ((a.selected?.length ?? 0) > 0 || a.value != null || a.note?.trim());
    }).length;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted)]">
        Standard pediatric history modules. Tap a module to expand; the badge shows how many items you’ve recorded.
      </p>
      {STANDARD_MODULES.map((g) => {
        const done = answeredCount(g);
        return (
          <details key={g.id} className="card p-0">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 font-semibold">
              <span>{g.title}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${done ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                {done}/{g.questions.length}
              </span>
            </summary>
            <div className="border-t border-[var(--border)] px-4 pb-2">
              {g.questions.map((q) => (
                <ChipQuestion key={q.id} question={q} answer={c.answers.find((a) => a.questionId === q.id)} onChange={setAnswer} />
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
