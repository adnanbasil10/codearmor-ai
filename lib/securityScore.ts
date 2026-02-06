export type Severity = "HIGH" | "MEDIUM" | "LOW";

export interface SecurityIssue {
  id: string;
  severity: Severity;
  description: string;
}

export interface SecurityScoreInput {
  issues: SecurityIssue[];
  hasHardcodedSecrets: boolean;
  hasMissingRls: boolean;
}

export type SecurityStatus = "SECURE" | "NEEDS_ATTENTION" | "INSECURE";

export interface SecurityScoreResult {
  score: number;
  status: SecurityStatus;
  emoji: string;
}

export interface IssueSummary {
  high: number;
  medium: number;
  low: number;
}

export function summarizeIssues(issues: SecurityIssue[]): IssueSummary {
  return issues.reduce(
    (acc, issue) => {
      if (issue.severity === "HIGH") acc.high += 1;
      if (issue.severity === "MEDIUM") acc.medium += 1;
      if (issue.severity === "LOW") acc.low += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );
}

export function calculateSecurityScore(input: SecurityScoreInput): SecurityScoreResult {
  const { issues, hasHardcodedSecrets, hasMissingRls } = input;

  let score = 100;

  for (const issue of issues) {
    if (issue.severity === "HIGH") score -= 30;
    else if (issue.severity === "MEDIUM") score -= 15;
    else if (issue.severity === "LOW") score -= 5;
  }

  // Hardcoded secrets or missing RLS are treated as critical signals.
  if (hasHardcodedSecrets || hasMissingRls) {
    score = Math.min(score, 49);
  }

  if (score < 0) score = 0;

  let status: SecurityStatus;
  let emoji: string;

  if (score >= 80) {
    status = "SECURE";
    emoji = "🟢";
  } else if (score >= 50) {
    status = "NEEDS_ATTENTION";
    emoji = "🟡";
  } else {
    status = "INSECURE";
    emoji = "🔴";
  }

  return { score, status, emoji };
}

