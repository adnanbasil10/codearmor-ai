import type { IssueSummary, SecurityScoreResult, SecurityStatus } from "@/lib/securityScore";

interface SecurityStatusBadgeProps {
  result: SecurityScoreResult;
  summary: IssueSummary;
  hasMissingRls: boolean;
  hasHardcodedSecrets: boolean;
}

function statusClass(status: SecurityStatus): string {
  if (status === "SECURE") return "badge badge-secure";
  if (status === "NEEDS_ATTENTION") return "badge badge-attention";
  return "badge badge-insecure";
}

function statusLabel(status: SecurityStatus): string {
  if (status === "SECURE") return "Secure";
  if (status === "NEEDS_ATTENTION") return "Needs attention";
  return "Insecure";
}

export function SecurityStatusBadge({
  result,
  summary,
  hasMissingRls,
  hasHardcodedSecrets
}: SecurityStatusBadgeProps) {
  const { score, emoji, status } = result;

  return (
    <div>
      <div className={statusClass(status)}>
        <span className="text-lg">{emoji}</span>
        <span>{statusLabel(status)}</span>
        <span className="text-slate-300/80">Score {score}</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
        <div className="rounded-lg bg-slate-900/70 p-3 ring-1 ring-slate-800/80">
          <dt className="mb-1 font-medium text-slate-200">Issue breakdown</dt>
          <dd className="space-y-1">
            <div className="flex items-center justify-between">
              <span>HIGH</span>
              <span className="font-mono text-rose-300">{summary.high}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>MEDIUM</span>
              <span className="font-mono text-amber-300">{summary.medium}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>LOW</span>
              <span className="font-mono text-sky-300">{summary.low}</span>
            </div>
          </dd>
        </div>

        <div className="rounded-lg bg-slate-900/70 p-3 ring-1 ring-slate-800/80">
          <dt className="mb-1 font-medium text-slate-200">Critical signals</dt>
          <dd className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Hardcoded secrets</span>
              <span
                className={`font-mono ${
                  hasHardcodedSecrets ? "text-rose-300" : "text-emerald-300"
                }`}
              >
                {hasHardcodedSecrets ? "DETECTED" : "NONE"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Missing RLS</span>
              <span
                className={`font-mono ${
                  hasMissingRls ? "text-rose-300" : "text-emerald-300"
                }`}
              >
                {hasMissingRls ? "DETECTED" : "NONE"}
              </span>
            </div>
          </dd>
        </div>
      </dl>
    </div>
  );
}

