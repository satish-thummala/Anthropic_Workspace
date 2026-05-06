import { useState } from "react";
import { WORKFLOW_STEPS, WORKFLOW_ACTIVE } from "../data/mockData";

const card = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
};
const darkCard = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
};

const URGENCY: Record<string, { bg: string; text: string }> = {
  high: { bg: "#fef2f2", text: "#991b1b" },
  medium: { bg: "#fffbeb", text: "#92400e" },
  low: { bg: "#f0fdf4", text: "#065f46" },
};

const AUDIT_LOG = [
  {
    time: "09:14",
    action: "WF-0033 approved by Finance Mgr — Zainab M.",
    type: "approve",
  },
  {
    time: "08:52",
    action: "WF-0038 escalated to Director — auto-escalation (48h rule)",
    type: "escalate",
  },
  {
    time: "08:30",
    action: "WF-0041 submitted by Abdul K. — Bitumen supply RM 1.2M",
    type: "submit",
  },
  {
    time: "07:45",
    action: "WF-0035 approved by HOD — Rashida M.",
    type: "approve",
  },
  {
    time: "07:10",
    action: "WF-0029 PO issued — Server rack replacement RM 95K",
    type: "complete",
  },
  {
    time: "06:00",
    action: "System: 3 approvals pending >72h — auto-reminder sent",
    type: "system",
  },
];

const LOG_COLORS: Record<string, string> = {
  approve: "#10b981",
  escalate: "#f59e0b",
  submit: "#2563eb",
  complete: "#8b5cf6",
  system: "#94a3b8",
};

function StepBadge({
  step,
  current,
  total,
}: {
  step: number;
  current: number;
  total: number;
}) {
  const done = step < current;
  const active = step === current;
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all"
        style={{
          background: done ? "#10b981" : active ? "#2563eb" : "#f1f5f9",
          color: done || active ? "#fff" : "#94a3b8",
          boxShadow: active ? "0 0 0 4px rgba(37,99,235,0.2)" : "none",
        }}
      >
        {done ? "✓" : step}
      </div>
    </div>
  );
}

export default function WorkflowPage() {
  const [selectedWf, setSelectedWf] = useState(WORKFLOW_ACTIVE[0]);
  const [newReq, setNewReq] = useState({
    item: "",
    amount: "",
    dept: "",
    urgency: "medium",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setNewReq({ item: "", amount: "", dept: "", urgency: "medium" });
  };

  const inputStyle = {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#1e293b",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    outline: "none",
    width: "100%",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl p-5" style={darkCard}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse-slow" />
              <span className="text-xs text-blue-400 font-medium">
                LIVE · Workflow Engine · Digital Approvals
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Workflow Automation
            </h2>
            <p className="text-sm text-slate-400">
              Paperless procurement · End-to-end digital sign-off · Full audit
              trail
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              {
                val: WORKFLOW_ACTIVE.length,
                label: "In Progress",
                color: "#3b82f6",
                bg: "rgba(59,130,246,0.15)",
                border: "rgba(59,130,246,0.3)",
              },
              {
                val: 18,
                label: "Completed (MTD)",
                color: "#10b981",
                bg: "rgba(16,185,129,0.15)",
                border: "rgba(16,185,129,0.3)",
              },
              {
                val: 3,
                label: "Pending >48h",
                color: "#f59e0b",
                bg: "rgba(245,158,11,0.15)",
                border: "rgba(245,158,11,0.3)",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="px-4 py-2 rounded-xl text-center"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
              >
                <div className="text-xl font-bold" style={{ color: s.color }}>
                  {s.val}
                </div>
                <div className="text-xs" style={{ color: s.color }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Procurement Flow Diagram */}
      <div className="p-5" style={card}>
        <h3 className="font-semibold text-slate-800 mb-1">
          Procurement Approval Flow
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Standard workflow · 6 stages · Average cycle: 17 hours
        </p>

        {/* Steps */}
        <div className="relative">
          {/* Connector line */}
          <div
            className="absolute top-4.5 left-0 right-0 h-0.5 mx-16 hidden lg:block"
            style={{ background: "#e2e8f0", zIndex: 0, top: "18px" }}
          />

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 relative">
            {WORKFLOW_STEPS.map((step, i) => (
              <div
                key={step.id}
                className="flex flex-col items-center text-center gap-2"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl z-10 relative"
                  style={{
                    background: "#f0f9ff",
                    border: "2px solid #bae6fd",
                    boxShadow: "0 0 0 4px #fff",
                  }}
                >
                  {step.icon}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700">
                    {step.label}
                  </div>
                  <div className="text-xs text-slate-400">{step.role}</div>
                  <div className="text-xs text-blue-500 font-medium mt-0.5">
                    {step.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Active workflows tracker */}
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-4">Active Requests</h3>
          <div className="space-y-3">
            {WORKFLOW_ACTIVE.map((wf) => {
              const urg = URGENCY[wf.urgency];
              return (
                <div
                  key={wf.id}
                  onClick={() => setSelectedWf(wf)}
                  className="p-4 rounded-xl cursor-pointer transition-all hover:shadow-md"
                  style={{
                    border:
                      selectedWf.id === wf.id
                        ? "2px solid #2563eb"
                        : "1px solid #e2e8f0",
                    background: selectedWf.id === wf.id ? "#f0f9ff" : "#f8fafc",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-blue-700">
                          {wf.id}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-semibold"
                          style={urg}
                        >
                          {wf.urgency}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {wf.item}
                      </div>
                      <div className="text-xs text-slate-500">
                        By {wf.requestedBy} · {wf.requestDate}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-slate-800">
                        RM {(wf.amount / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs text-slate-400">
                        Step {wf.currentStep}/{WORKFLOW_STEPS.length}
                      </div>
                    </div>
                  </div>
                  {/* Step progress */}
                  <div className="flex items-center gap-1">
                    {WORKFLOW_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-1.5 rounded-full transition-all"
                        style={{
                          background:
                            i + 1 < wf.currentStep
                              ? "#10b981"
                              : i + 1 === wf.currentStep
                                ? "#2563eb"
                                : "#e2e8f0",
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-1.5 text-xs font-medium text-blue-600">
                    Current: {WORKFLOW_STEPS[wf.currentStep - 1]?.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {/* New request form */}
          <div className="p-5" style={card}>
            <h3 className="font-semibold text-slate-800 mb-4">
              Submit New Procurement Request
            </h3>
            {submitted && (
              <div
                className="mb-4 px-4 py-3 rounded-xl text-sm font-medium text-emerald-700"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
              >
                ✓ Request submitted! Workflow initiated — Dept HOD notified.
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Item / Description
                </label>
                <input
                  value={newReq.item}
                  onChange={(e) =>
                    setNewReq({ ...newReq, item: e.target.value })
                  }
                  placeholder="e.g. Concrete mixer rental — PRJ-006"
                  style={inputStyle}
                  required
                  onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Amount (RM)
                  </label>
                  <input
                    type="number"
                    value={newReq.amount}
                    onChange={(e) =>
                      setNewReq({ ...newReq, amount: e.target.value })
                    }
                    placeholder="0.00"
                    style={inputStyle}
                    required
                    onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Department
                  </label>
                  <select
                    value={newReq.dept}
                    onChange={(e) =>
                      setNewReq({ ...newReq, dept: e.target.value })
                    }
                    style={{ ...inputStyle, cursor: "pointer" }}
                    required
                  >
                    <option value="">Select dept</option>
                    <option>Project Delivery</option>
                    <option>Toll Operations</option>
                    <option>O&M</option>
                    <option>IT & Technical</option>
                    <option>Finance & Treasury</option>
                    <option>Contract & Procurement</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Urgency
                </label>
                <div className="flex gap-2">
                  {["low", "medium", "high"].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setNewReq({ ...newReq, urgency: u })}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                      style={
                        newReq.urgency === u
                          ? { background: "#2563eb", color: "#fff" }
                          : {
                              background: "#f8fafc",
                              color: "#64748b",
                              border: "1px solid #e2e8f0",
                            }
                      }
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg, #1e40af, #2563eb)",
                  boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                }}
              >
                Submit for Approval →
              </button>
            </form>
          </div>

          {/* Audit trail */}
          <div className="p-5" style={card}>
            <h3 className="font-semibold text-slate-800 mb-3">Audit Trail</h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {AUDIT_LOG.map((log, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 py-2 border-b last:border-0"
                  style={{ borderColor: "#f8fafc" }}
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: LOG_COLORS[log.type] }}
                  />
                  <div className="flex-1">
                    <p className="text-xs text-slate-700">{log.action}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {log.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
