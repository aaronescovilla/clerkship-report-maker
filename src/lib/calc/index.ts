// Deterministic clinical calculators. The AI pipeline must NOT perform these
// computations; it requests them from here so results are auditable.

// ---- Holliday-Segar maintenance fluids ----
export function hollidaySegarPerDayMl(weightKg: number): number {
  if (weightKg <= 0) return 0;
  if (weightKg <= 10) return 100 * weightKg;
  if (weightKg <= 20) return 1000 + 50 * (weightKg - 10);
  return 1500 + 20 * (weightKg - 20);
}

export function hollidaySegarRateMlPerHr(weightKg: number): number {
  return round(hollidaySegarPerDayMl(weightKg) / 24, 1);
}

/** 4-2-1 hourly maintenance rule. */
export function rule421MlPerHr(weightKg: number): number {
  if (weightKg <= 0) return 0;
  if (weightKg <= 10) return 4 * weightKg;
  if (weightKg <= 20) return 40 + 2 * (weightKg - 10);
  return 60 + 1 * (weightKg - 20);
}

// ---- Anthropometrics ----
export function bmi(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return round(weightKg / (m * m), 1);
}

/** Upper/lower segment ratio normal values from the manual. */
export function expectedULRatio(ageMonths: number): number {
  if (ageMonths < 1) return 1.7;
  if (ageMonths <= 36) return 1.3;
  return 1.0;
}

// ---- Weight-based dosing ----
export interface DoseResult {
  mgPerDay: number;
  mgPerDose: number;
  mlPerDose?: number;
  note: string;
}

/**
 * @param weightKg patient weight
 * @param mgPerKgPerDay total daily dose per kg
 * @param dosesPerDay frequency
 * @param concentrationMgPerMl optional liquid concentration to compute mL/dose
 */
export function weightBasedDose(
  weightKg: number,
  mgPerKgPerDay: number,
  dosesPerDay: number,
  concentrationMgPerMl?: number
): DoseResult {
  const mgPerDay = round(weightKg * mgPerKgPerDay, 1);
  const mgPerDose = round(mgPerDay / Math.max(1, dosesPerDay), 1);
  const mlPerDose = concentrationMgPerMl ? round(mgPerDose / concentrationMgPerMl, 1) : undefined;
  return {
    mgPerDay,
    mgPerDose,
    mlPerDose,
    note: "Verify against a current pediatric formulary before prescribing.",
  };
}

// ---- WHO growth z-score (LMS method) ----
// General LMS math; ship a small embedded subset and extend with full WHO tables.
export interface LMS { L: number; M: number; S: number }

export function lmsZScore(value: number, lms: LMS): number {
  const { L, M, S } = lms;
  const z = L !== 0 ? (Math.pow(value / M, L) - 1) / (L * S) : Math.log(value / M) / S;
  return round(z, 2);
}

/** Approximate percentile from a z-score (normal CDF). */
export function zToPercentile(z: number): number {
  // Abramowitz & Stegun 7.1.26 approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return round(p * 100, 1);
}

// Minimal embedded WHO weight-for-age sample (boys, selected ages, kg).
// Replace/extend with full WHO Child Growth Standards tables for production.
export const WHO_WFA_BOYS: Record<number, LMS> = {
  0: { L: 0.3487, M: 3.3464, S: 0.14602 },
  6: { L: 0.1257, M: 7.934, S: 0.11316 },
  12: { L: 0.0486, M: 9.6479, S: 0.10958 },
};

function round(n: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}
