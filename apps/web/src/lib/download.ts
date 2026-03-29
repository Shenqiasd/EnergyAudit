import { getAuthHeaders } from "./api/client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

/**
 * Trigger a file download from an API endpoint.
 * Handles authentication headers and creates a temporary download link.
 */
export async function downloadFile(
  path: string,
  filename: string,
): Promise<void> {
  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`下载失败: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(objectUrl);
}

/** Download report as PDF */
export function downloadReportPdf(reportId: string) {
  return downloadFile(
    `/reports/${reportId}/export/pdf`,
    `report-${reportId}.pdf`,
  );
}

/** Download report as Word document */
export function downloadReportDocx(reportId: string) {
  return downloadFile(
    `/reports/${reportId}/export/docx`,
    `report-${reportId}.docx`,
  );
}

/** Download review report as PDF */
export function downloadReviewPdf(reviewTaskId: string) {
  return downloadFile(
    `/reviews/${reviewTaskId}/export/pdf`,
    `review-${reviewTaskId}.pdf`,
  );
}

/** Download rectification report as PDF */
export function downloadRectificationPdf(rectificationTaskId: string) {
  return downloadFile(
    `/rectifications/${rectificationTaskId}/export/pdf`,
    `rectification-${rectificationTaskId}.pdf`,
  );
}
