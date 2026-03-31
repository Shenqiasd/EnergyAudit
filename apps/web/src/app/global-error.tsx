"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "32px", textAlign: "center" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>出现了一个错误</h2>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>服务暂时出现了问题，请稍后重试</p>
          <button
            onClick={reset}
            style={{ borderRadius: "8px", backgroundColor: "#2563eb", padding: "8px 16px", fontSize: "14px", color: "white", cursor: "pointer", border: "none" }}
          >
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
