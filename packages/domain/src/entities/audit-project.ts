export type AuditProjectStatus =
  | "setup"
  | "filing"
  | "reporting"
  | "review"
  | "rectification"
  | "completed";

export interface AuditProject {
  id: string;
  enterpriseId: string;
  batchId: string;
  status: AuditProjectStatus;
}

export function createAuditProject(
  overrides: Partial<AuditProject> = {},
): AuditProject {
  return {
    id: "project_1",
    enterpriseId: "ent_1",
    batchId: "batch_1",
    status: "setup",
    ...overrides,
  };
}
