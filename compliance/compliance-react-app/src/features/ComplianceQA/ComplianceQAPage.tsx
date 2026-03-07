import React, { useState, useEffect, useRef } from "react";
import type { ToastFn } from "../../types/compliance.types";
import {
  aiInsightsAPI,
  type AiStatusResponse,
} from "../../services/ai-insights-api";

interface Props {
  toast: ToastFn;
}

const SUGGESTED = [
  "What is our current risk score?",
  "Which frameworks have the lowest coverage?",
  "How many critical gaps are open?",
  "What evidence do we need for ISO27001?",
  "Have we improved over the last few months?",
  "What are the top 3 priorities to improve our compliance score?",
  "Which gaps should we close first?",
  "How does our GDPR compliance compare to SOC2?",
];

function EngineBadge({ status }: { status: AiStatusResponse | null }) {
  if (!status) return null;
  const g = status.activeEngine === "groq";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 99,
        background: g ? "#0F172A" : "#F3F4F6",
        border: `1px solid ${g ? "#334155" : "#E5E7EB"}`,
        fontSize: 11,
        fontWeight: 700,
        color: g ? "#93C5FD" : "#6B7280",
      }}
    >
      <span style={{ fontSize: 13 }}>{g ? "⚡" : "🔧"}</span>
      {g ? `Groq · ${status.model}` : "Local Intelligence Engine"}
    </div>
  );
}

export function ComplianceQAPage({ toast }: Props) {
  const [status, setStatus] = useState<AiStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string; ms?: number }[]
  >([]);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiInsightsAPI
      .getStatus()
      .then(setStatus)
      .catch(() => null);
  }, []);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleChat(q: string) {
    if (!q.trim()) return;
    const msg = q.trim();
    setQuestion("");
    setMessages((p) => [...p, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const r = await aiInsightsAPI.chat(msg);
      setMessages((p) => [
        ...p,
        { role: "ai", text: r.text, ms: r.durationMs },
      ]);
    } catch {
      setMessages((p) => [
        ...p,
        { role: "ai", text: "Sorry, I could not process that request." },
      ]);
      toast("AI request failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="slide-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            Compliance Q&amp;A
          </h1>
          <p>
            Ask AI anything about your compliance posture, frameworks, gaps,
            risk &amp; remediation strategy
          </p>
        </div>
        <EngineBadge status={status} />
      </div>

      {/* Main Chat Interface */}
      <div
        className="card"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 240px)",
          minHeight: 550,
        }}
      >
        {/* Suggested Questions (shown when no messages) */}
        {messages.length === 0 && (
          <div style={{ marginBottom: 16, padding: "0 4px" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text3)",
                letterSpacing: "0.07em",
                textTransform: "uppercase" as const,
                marginBottom: 12,
              }}
            >
              💡 Suggested Questions
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 8,
              }}
            >
              {SUGGESTED.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleChat(s)}
                  disabled={loading}
                  className="btn btn-secondary"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--surface2)",
                    fontSize: 12.5,
                    color: "var(--text2)",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textAlign: "left",
                    whiteSpace: "normal",
                    height: "auto",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#7C3AED";
                    e.currentTarget.style.background = "#F5F3FF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--surface2)";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "4px 4px 4px 0",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: m.role === "user" ? "#7C3AED" : "var(--surface2)",
                  color: m.role === "user" ? "white" : "var(--text)",
                  borderBottomRightRadius: m.role === "user" ? 3 : 12,
                  borderBottomLeftRadius: m.role === "ai" ? 3 : 12,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                  {m.text.split("\n").map((l, j) => (
                    <div key={j}>{l || <span>&nbsp;</span>}</div>
                  ))}
                </div>
                {m.ms && (
                  <div
                    style={{
                      fontSize: 10,
                      opacity: 0.5,
                      marginTop: 6,
                      fontStyle: "italic",
                    }}
                  >
                    {(m.ms / 1000).toFixed(1)}s
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: "var(--surface2)",
                  display: "flex",
                  gap: 4,
                }}
              >
                {[0, 1, 2].map((d) => (
                  <div
                    key={d}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#94A3B8",
                      animation: `pulse 1.2s ease-in-out ${d * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={chatEnd} />
        </div>

        {/* Input Area */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleChat(question)
              }
              placeholder="Ask about your compliance status, gaps, frameworks…"
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 16px",
                border: "1.5px solid var(--border)",
                borderRadius: 8,
                fontSize: 13.5,
                color: "var(--text)",
                background: "var(--surface2)",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => handleChat(question)}
              disabled={loading || !question.trim()}
              style={{
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                background: question.trim() ? "#7C3AED" : "var(--border)",
                color: question.trim() ? "white" : "var(--text3)",
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: question.trim() ? "pointer" : "default",
                transition: "all 0.15s",
                minWidth: 80,
              }}
            >
              {loading ? "Thinking…" : "Send"}
            </button>
          </div>

          {/* Clear button */}
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              style={{
                marginTop: 10,
                fontSize: 11.5,
                color: "var(--text3)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                padding: "4px 0",
              }}
            >
              🗑️ Clear conversation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
