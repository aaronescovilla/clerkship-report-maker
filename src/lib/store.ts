"use client";
import type { CaseRecord } from "./domain/types";

// Local-first storage for the demo / single-device use. The Supabase-backed
// store (with RLS, sharing, audit) is wired separately; see lib/supabase + supabase/schema.sql.
// Swap STORAGE here for the Supabase adapter when env vars are present.

const KEY = "clerkship.cases.v1";

function readAll(): CaseRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as CaseRecord[];
  } catch {
    return [];
  }
}

function writeAll(cases: CaseRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(cases));
}

export function listCases(): CaseRecord[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getCase(id: string): CaseRecord | undefined {
  return readAll().find((c) => c.id === id);
}

export function saveCase(c: CaseRecord) {
  const all = readAll();
  const idx = all.findIndex((x) => x.id === c.id);
  c.updatedAt = new Date().toISOString();
  if (idx >= 0) all[idx] = c;
  else all.push(c);
  writeAll(all);
}

export function deleteCase(id: string) {
  writeAll(readAll().filter((c) => c.id !== id));
}

export function createCase(complaintId: string, complaintLabel: string): CaseRecord {
  const now = new Date().toISOString();
  const c: CaseRecord = {
    id: crypto.randomUUID(),
    specialty: "pediatrics",
    complaintId,
    complaintLabel,
    header: { reliabilityPct: 85 },
    answers: [],
    timeline: [],
    pe: {},
    deidentified: true,
    createdAt: now,
    updatedAt: now,
  };
  saveCase(c);
  return c;
}

// Common "prior to admission" anchors for the HPI timeline.
export const PTA_PRESETS: { label: string; hoursPrior: number }[] = [
  { label: "Onset (apparently well until…)", hoursPrior: 100000 },
  { label: "2 weeks PTA", hoursPrior: 336 },
  { label: "1 week PTA", hoursPrior: 168 },
  { label: "5 days PTA", hoursPrior: 120 },
  { label: "3 days PTA", hoursPrior: 72 },
  { label: "2 days PTA", hoursPrior: 48 },
  { label: "1 day PTA", hoursPrior: 24 },
  { label: "Few hours PTA", hoursPrior: 4 },
  { label: "On admission", hoursPrior: 0 },
];
