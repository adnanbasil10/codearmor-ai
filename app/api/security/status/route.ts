import { NextResponse } from "next/server";
import {
  calculateSecurityScore,
  summarizeIssues,
  type SecurityIssue
} from "@/lib/securityScore";

export const dynamic = "force-dynamic";

export async function GET() {
  // Hook point: feed concrete scanner findings into this array.
  const issues: SecurityIssue[] = [];

  // With no application code yet, we assume no hardcoded secrets but missing RLS.
  const hasHardcodedSecrets = false;
  const hasMissingRls = true;

  const summary = summarizeIssues(issues);
  const result = calculateSecurityScore({
    issues,
    hasHardcodedSecrets,
    hasMissingRls
  });

  return NextResponse.json({
    ...result,
    issues,
    meta: {
      ...summary,
      hasHardcodedSecrets,
      hasMissingRls
    }
  });
}

