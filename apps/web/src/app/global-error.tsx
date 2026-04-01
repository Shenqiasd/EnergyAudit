"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", backgroundColor: "#f8f9fb" }}>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "32px", textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111", margin: 0 }}>出现了一个错误</h2>
          <p style={{ fontSize: "14px", color: "#787878", margin: 0, maxWidth: "280px", lineHeight: "1.6" }}>服务暂时出现了问题，请稍后重试</p>
          <button
            onClick={reset}
            style={{
              marginTop: "8px",
              borderRadius: "12px",
              backgroundColor: "#2d4b9e",
              padding: "8px 20px",
              fontSize: "14px",
              fontWeight: "500",
              color: "white",
              cursor: "pointer",
              border: "none",
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
