import React from "react";

function OutputPanel({ stdout, stderr, exitCode }) {
  return (
    <div style={{ marginTop: 12 }}>
      <h3>Output</h3>
      <pre style={{
        background: "#111",
        color: "#eaeaea",
        padding: 12,
        minHeight: 120,
        overflowX: "auto"
      }}>
{stdout || "(no stdout)"}
      </pre>

      {stderr ? (
        <>
          <h4 style={{ color: "#ff6b6b" }}>Errors</h4>
          <pre style={{
            background: "#2a0000",
            color: "#ffd6d6",
            padding: 12,
            overflowX: "auto"
          }}>
{stderr}
          </pre>
        </>
      ) : null}

      <div style={{ marginTop: 8, fontSize: 14, opacity: 0.8 }}>
        Exit code: {exitCode === null ? "n/a" : exitCode}
      </div>
    </div>
  );
}

export default OutputPanel;
