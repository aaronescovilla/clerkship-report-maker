"use client";
import type { Answer } from "@/lib/domain/types";
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Standard pediatric history modules (Review of Systems by organ system, plus birth, family, nutrition, immunization, development, social, environmental).
      </p>
      {STANDARD_MODULES.map((g) => (
        <details key={g.id} className="card p-0" open={g.id === "ros"}>
          <summary className="cursor-pointer px-4 py-3 font-semibold">{g.title}</summary>
          <div className="border-t border-[var(--border)] px-4 pb-2">
            {g.questions.map((q) => (
              <ChipQuestion key={q.id} question={q} answer={c.answers.find((a) => a.questionId === q.id)} onChange={setAnswer} />
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
