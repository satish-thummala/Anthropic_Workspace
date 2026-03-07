import React, { useState, useMemo } from "react";
import type {
  ToastFn,
  ApiGap,
  ApiGapStatus,
} from "../../types/compliance.types";
import { useGaps, useGapStats } from "../../hooks/useGaps";
import { useFrameworks } from "../../hooks/useFrameworks";
import { useGapCount } from "../../contexts/GapCountContext";
import { gapAPI } from "../../services/gap-api";
import { SEV_COLORS, SEV_BG, STATUS_MAP } from "../../constants/statusMaps";
import { Icons } from "../../components/shared/Icons";

interface Props {
  toast: ToastFn;
}

// ─── STATUS WORKFLOW ──────────────────────────────────────────────────────────

function nextStatus(current: ApiGapStatus): ApiGapStatus {
  if (current === "open") return "in_progress";
  if (current === "in_progress") return "resolved";
  return "resolved";
}

function actionLabel(status: ApiGapStatus): string {
  if (status === "open") return "Start";
  if (status === "in_progress") return "Resolve";
  return "";
}

// ─── SINGLE GAP CARD ─────────────────────────────────────────────────────────

function GapCard({
  gap,
  onStatusChange,
  toast,
}: {
  gap: ApiGap;
  onStatusChange: (updated: ApiGap) => void;
  toast: ToastFn;
}) {
  const [updating, setUpdating] = useState(false);
  const st = (STATUS_MAP as any)[gap.status] ?? STATUS_MAP.open;

  async function handleStatusChange() {
    const next = nextStatus(gap.status);
    setUpdating(true);
    try {
      const updated = await gapAPI.updateStatus(gap.id, next);
      onStatusChange(updated);
      toast(
        `Gap marked as ${(STATUS_MAP as any)[next]?.label ?? next}`,
        "success",
      );
    } catch {
      toast("Failed to update gap status", "error");
    } finally {
      setUpdating(false);
    }
  }

  const canAdvance =
    gap.status !== "resolved" && gap.status !== "accepted_risk";

  return (
    <div
      className="gap-item"
      style={{ borderLeftColor: SEV_COLORS[gap.severity] }}
    >
      <div className="gap-header">
        <span className="gap-control">{gap.controlCode}</span>

        <div style={{ flex: 1 }}>
          <div className="gap-title">{gap.controlTitle}</div>
          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 5,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              className="fw-badge"
              style={{
                background: `${gap.frameworkColor}18`,
                color: gap.frameworkColor,
                border: `1px solid ${gap.frameworkColor}40`,
              }}
            >
              {gap.frameworkCode}
            </span>
            <span
              className="badge"
              style={{
                background: SEV_BG[gap.severity],
                color: SEV_COLORS[gap.severity],
                fontSize: 11,
              }}
            >
              {gap.severity}
            </span>
            <span
              className="badge"
              style={{ background: st.bg, color: st.color, fontSize: 11 }}
            >
              {st.label}
            </span>
            {gap.controlCategory && (
              <span style={{ fontSize: 11, color: "var(--text3)" }}>
                {gap.controlCategory}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {canAdvance && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 12, minWidth: 70 }}
              onClick={handleStatusChange}
              disabled={updating}
            >
              {updating ? (
                <span
                  style={{
                    width: 11,
                    height: 11,
                    border: "2px solid var(--border2)",
                    borderTopColor: "var(--accent)",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
              ) : (
                actionLabel(gap.status)
              )}
            </button>
          )}
          {gap.status === "resolved" && (
            <Icons.Check
              style={{ width: 18, height: 18, color: "#16A34A", marginTop: 2 }}
            />
          )}
          {gap.status === "accepted_risk" && (
            <span style={{ fontSize: 11, color: "#8B5CF6", fontWeight: 600 }}>
              Accepted
            </span>
          )}
        </div>
      </div>

      {gap.description && <p className="gap-desc">{gap.description}</p>}

      {gap.aiSuggestion && (
        <div className="gap-suggestion">
          <div className="gap-suggestion-label">Recommended Action</div>
          <div className="gap-suggestion-text">{gap.aiSuggestion}</div>
        </div>
      )}

      {gap.remediationNotes && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            background: "#F0FDF4",
            borderRadius: 8,
            border: "1px solid #BBF7D0",
            fontSize: 12,
            color: "#065F46",
          }}
        >
          <span style={{ fontWeight: 600 }}>Resolution note: </span>
          {gap.remediationNotes}
        </div>
      )}

      {gap.assignedToName && (
        <div style={{ marginTop: 6, fontSize: 12, color: "var(--text3)" }}>
          Assigned to{" "}
          <span style={{ fontWeight: 600, color: "var(--text2)" }}>
            {gap.assignedToName}
          </span>
          {gap.targetDate && <span> · Due {gap.targetDate}</span>}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export function GapsPage({ toast }: Props) {
  const [sevFilter, setSevFilter] = useState("all");
  const [fwFilter, setFwFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [runningAnalysis, setRunningAnalysis] = useState(false);

  const { gaps, loading, error, reload, updateGapLocally } = useGaps({
    framework: fwFilter !== "all" ? fwFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { stats, loading: statsLoading, reload: reloadStats } = useGapStats();
  const { frameworks } = useFrameworks();
  const { refreshGapCount } = useGapCount();

  const filtered = useMemo(
    () =>
      gaps.filter((g) => {
        if (sevFilter !== "all" && g.severity !== sevFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          if (
            !g.controlCode.toLowerCase().includes(q) &&
            !g.controlTitle.toLowerCase().includes(q) &&
            !(g.description ?? "").toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      }),
    [gaps, sevFilter, search],
  );

  const counts = {
    CRITICAL: stats?.critical ?? 0,
    HIGH: stats?.high ?? 0,
    MEDIUM: stats?.medium ?? 0,
    LOW: stats?.low ?? 0,
  };

  async function handleRunAnalysis() {
    setRunningAnalysis(true);
    try {
      // Call the analyze endpoint
      const result = await gapAPI.runAnalysis();

      // Show comprehensive results
      if (result.newGapsCreated > 0) {
        toast(
          `Analysis complete: ${result.newGapsCreated} new gap${result.newGapsCreated === 1 ? "" : "s"} identified`,
          "info",
        );

        // Optionally show detailed breakdown
        console.log("Gap Analysis Results:", {
          totalScanned: result.totalControlsScanned,
          newGaps: result.newGapsCreated,
          existing: result.existingGaps,
          totalActive: result.totalActiveGaps,
          byFramework: result.gapsByFramework,
          bySeverity: result.gapsBySeverity,
          timeMs: result.analysisTimeMs,
        });
      } else {
        toast(result.message || "Gap analysis complete", "success");
      }

      // Reload gaps, stats, AND global gap count
      await Promise.all([reload(), reloadStats(), refreshGapCount()]);
    } catch (error: any) {
      console.error("Gap analysis failed:", error);
      toast(
        error?.response?.data?.message || "Failed to run gap analysis",
        "error",
      );
    } finally {
      setRunningAnalysis(false);
    }
  }

  async function handleGapUpdated(updated: ApiGap) {
    updateGapLocally(updated);
    // Refresh both local stats and global gap count
    await Promise.all([reloadStats(), refreshGapCount()]);
  }

  if (loading && gaps.length === 0)
    return (
      <div
        className="slide-in"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
        }}
      >
        <div style={{ textAlign: "center", color: "var(--text3)" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⟳</div>
          <div>Loading gaps…</div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="slide-in">
        <div
          className="card"
          style={{ textAlign: "center", padding: 40, color: "#DC2626" }}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠</div>
          <div style={{ fontWeight: 600 }}>Failed to load gaps</div>
          <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 4 }}>
            {error}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 16 }}
            onClick={reload}
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="slide-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Compliance Gap Analysis</h1>
          <p>
            Identified control gaps across all mapped frameworks and documents
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleRunAnalysis}
          disabled={runningAnalysis}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          {runningAnalysis ? (
            <span
              style={{
                width: 12,
                height: 12,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "white",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
              }}
            />
          ) : (
            <Icons.Zap style={{ width: 14, height: 14 }} />
          )}
          {runningAnalysis ? "Refreshing…" : "Run Gap Analysis"}
        </button>
      </div>

      {/* Severity cards */}
      <div
        className="stats-grid"
        style={{ gridTemplateColumns: "repeat(4,1fr)" }}
      >
        {(Object.entries(counts) as [string, number][]).map(([sev, count]) => (
          <div
            key={sev}
            className="stat-card"
            style={{
              cursor: "pointer",
              borderTop: `3px solid ${SEV_COLORS[sev as keyof typeof SEV_COLORS]}`,
              opacity: statsLoading ? 0.6 : 1,
              outline:
                sevFilter === sev
                  ? `2px solid ${SEV_COLORS[sev as keyof typeof SEV_COLORS]}`
                  : "none",
              outlineOffset: 2,
            }}
            onClick={() => setSevFilter((prev) => (prev === sev ? "all" : sev))}
          >
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: SEV_COLORS[sev as keyof typeof SEV_COLORS],
              }}
            >
              {count}
            </div>
            <div
              style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}
            >
              {sev} Severity
            </div>
          </div>
        ))}
      </div>

      {/* Status pill summary */}
      {stats && (
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {[
            {
              label: "Open",
              key: "open",
              val: stats.totalOpen,
              color: "#EF4444",
              bg: "#FEF2F2",
            },
            {
              label: "In Progress",
              key: "in_progress",
              val: stats.totalInProgress,
              color: "#3B82F6",
              bg: "#EFF6FF",
            },
            {
              label: "Resolved",
              key: "resolved",
              val: stats.totalResolved,
              color: "#22C55E",
              bg: "#F0FDF4",
            },
            {
              label: "Accepted Risk",
              key: "accepted_risk",
              val: stats.totalAcceptedRisk,
              color: "#8B5CF6",
              bg: "#F5F3FF",
            },
          ].map((s) => (
            <div
              key={s.key}
              onClick={() =>
                setStatusFilter((prev) => (prev === s.key ? "all" : s.key))
              }
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: s.color,
                background: s.bg,
                border: `1px solid ${s.color}40`,
                outline:
                  statusFilter === s.key ? `2px solid ${s.color}` : "none",
                outlineOffset: 1,
              }}
            >
              {s.val} {s.label}
            </div>
          ))}
        </div>
      )}

      {/* Filters bar */}
      <div className="search-bar section-gap">
        <div className="search-input-wrap">
          <Icons.Search />
          <input
            className="search-input"
            placeholder="Search by control ID, title or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={sevFilter}
          onChange={(e) => setSevFilter(e.target.value)}
        >
          <option value="all">All Severities</option>
          {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={fwFilter}
          onChange={(e) => setFwFilter(e.target.value)}
        >
          <option value="all">All Frameworks</option>
          {frameworks.map((f) => (
            <option key={f.code} value={f.code}>
              {f.name}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="accepted_risk">Accepted Risk</option>
        </select>
      </div>

      {/* Result count */}
      <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 12 }}>
        Showing{" "}
        <strong style={{ color: "var(--text1)" }}>{filtered.length}</strong> gap
        {filtered.length !== 1 ? "s" : ""}
        {gaps.length !== filtered.length && ` (filtered from ${gaps.length})`}
      </div>

      {/* Gap cards */}
      {filtered.map((gap) => (
        <GapCard
          key={gap.id}
          gap={gap}
          onStatusChange={handleGapUpdated}
          toast={toast}
        />
      ))}

      {/* Empty state */}
      {filtered.length === 0 && !loading && (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <Icons.Check
            style={{
              width: 40,
              height: 40,
              color: "#16A34A",
              margin: "0 auto 12px",
            }}
          />
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {gaps.length === 0
              ? "All controls are covered — great work!"
              : "No gaps match your filters"}
          </div>
          <div style={{ color: "var(--text2)", marginTop: 4, fontSize: 13 }}>
            {gaps.length === 0
              ? "Run the Gap Analysis to check for new gaps"
              : "Try adjusting your search criteria"}
          </div>
        </div>
      )}
    </div>
  );
}
