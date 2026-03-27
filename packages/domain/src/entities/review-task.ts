export type ReviewTaskStatus =
  | "pending_assignment"
  | "assigned"
  | "in_review"
  | "completed";

export interface ReviewTask {
  id: string;
  auditProjectId: string;
  reportId: string;
  reviewerId: string;
  status: ReviewTaskStatus;
}

export function createReviewTask(
  overrides: Partial<ReviewTask> = {},
): ReviewTask {
  return {
    id: "review_1",
    auditProjectId: "project_1",
    reportId: "report_1",
    reviewerId: "reviewer_1",
    status: "pending_assignment",
    ...overrides,
  };
}
