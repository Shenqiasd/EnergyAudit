export type ReportStatus = "draft" | "submitted" | "archived";
export type ReportVersionType =
  | "system_draft"
  | "enterprise_revision"
  | "final_archive";

export interface Report {
  id: string;
  auditProjectId: string;
  version: number;
  versionType: ReportVersionType;
  status: ReportStatus;
}

export function createReport(overrides: Partial<Report> = {}): Report {
  return {
    id: "report_1",
    auditProjectId: "project_1",
    version: 1,
    versionType: "system_draft",
    status: "draft",
    ...overrides,
  };
}
