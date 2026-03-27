export type RectificationTaskStatus =
  | "pending"
  | "in_progress"
  | "ready_for_acceptance"
  | "completed";

export interface RectificationTask {
  id: string;
  auditProjectId: string;
  reviewTaskId: string;
  title: string;
  status: RectificationTaskStatus;
}

export function createRectificationTask(
  overrides: Partial<RectificationTask> = {},
): RectificationTask {
  return {
    id: "rectification_1",
    auditProjectId: "project_1",
    reviewTaskId: "review_1",
    title: "完善能源审计整改计划",
    status: "pending",
    ...overrides,
  };
}
