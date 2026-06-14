import type { CaseRecord } from "@/lib/domain/types";

export interface WorkspaceProps {
  c: CaseRecord;
  update: (fn: (draft: CaseRecord) => void) => void;
}
