// Smoke test the generation + verification pipeline against the running dev server (mock mode).
const BASE = "http://localhost:3000";

const setRes = await fetch(`${BASE}/api/question-set`, { method: "POST", body: JSON.stringify({ complaintId: "cough-colds" }) });
const { set } = await setRes.json();

const now = new Date().toISOString();
const c = {
  id: "test-1", specialty: "pediatrics", complaintId: "cough-colds", complaintLabel: "Cough and/or colds",
  header: { initials: "D.L.", ageText: "6 months old", sex: "male", informant: "mother", reliabilityPct: 85 },
  answers: [
    { questionId: "ros:respiratory", selected: ["cough"] },
    { questionId: "ros:general", selected: ["loss-of-appetite"] },
    { questionId: "imm:status", selected: ["incomplete"] },
  ],
  timeline: [
    { id: "e1", label: "Onset (apparently well until…)", hoursPrior: 336, answers: [
      { questionId: "rhinorrhea", selected: ["clear"] },
      { questionId: "associated", selected: ["warm"] },
      { questionId: "intake", value: 7 },
      { questionId: "meds", selected: ["cetirizine"], note: "Cetirizine 2.5mg/mL once daily x14d" },
      { questionId: "response", selected: ["none"] },
      { questionId: "consult", selected: ["private"] },
    ]},
    { id: "e2", label: "5 days PTA", hoursPrior: 120, answers: [
      { questionId: "cough", selected: ["productive", "whitish", "crackles"] },
      { questionId: "intake", value: 5 },
      { questionId: "meds", selected: ["salbutamol", "amoxicillin"] },
      { questionId: "response", selected: ["minimal"] },
    ]},
    { id: "e3", label: "Few hours PTA", hoursPrior: 4, answers: [
      { questionId: "rhinorrhea", selected: ["thick"] },
      { questionId: "associated", selected: ["lowurine", "poorfeed"] },
      { questionId: "intake", value: 2 },
      { questionId: "consult", selected: ["er"] },
    ]},
  ],
  pe: { generalSurvey: "Awake, irritable, not in distress", vitals: { hr: 148, rr: 46, temp: 37.2, spo2: 98 }, anthropometrics: { weightKg: 9.2 }, findings: { chestLungs: "Crackles over anterior lung fields, no retractions" } },
  deidentified: true, createdAt: now, updatedAt: now,
};

console.log("--- NARRATIVE ---");
const nr = await fetch(`${BASE}/api/narrative`, { method: "POST", body: JSON.stringify({ case: c, set }) });
const nd = await nr.json();
console.log("HPI:", nd.narrative?.sections?.hpi);
console.log("ROS:", nd.narrative?.sections?.ros);
console.log("CC:", nd.narrative?.sections?.chiefComplaint);
console.log("Verify:", nd.verification?.score, nd.verification?.passed, "structural:", nd.verification?.structural);

console.log("\n--- REPORT ---");
c.narrative = nd.narrative;
const rr = await fetch(`${BASE}/api/report`, { method: "POST", body: JSON.stringify({ case: c, set }) });
const rd = await rr.json();
console.log("status", rr.status, "error:", rd.error);
console.log(rd.report?.markdown?.slice(0, 600));
console.log("Verify:", rd.verification?.score, rd.verification?.passed, "structural:", rd.verification?.structural);
