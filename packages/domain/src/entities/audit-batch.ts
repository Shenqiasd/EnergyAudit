export type AuditBatchStatus =
  | "draft"
  | "active"
  | "under_review"
  | "completed";

export interface AuditBatch {
  id: string;
  name: string;
  year: number;
  status: AuditBatchStatus;
  templateVersionId?: string;
}

export function createAuditBatch(
  overrides: Partial<AuditBatch> = {},
): AuditBatch {
  return {
    id: "batch_1",
    name: "2026 能源审计批次",
    year: 2026,
    status: "draft",
    ...overrides,
  };
}
