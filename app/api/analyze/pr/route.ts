import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const GITHUB_API_BASE = "https://api.github.com";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

interface PRAnalysisRequest {
    owner: string;
    repo: string;
    prNumber: number;
}

interface PRFile {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
}

interface SecurityRegression {
    id: string;
    title: string;
    description: string;
    originalFixPR: number;
    originalFixDate: string;
    reintroducedIn: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
}

interface RiskDelta {
    score: number; // 0-100
    level: "LOW" | "MEDIUM" | "HIGH";
    reasons: string[];
    changedFiles: {
        auth: number;
        database: number;
        api: number;
        config: number;
    };
}

interface Finding {
    id: string;
    title: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    certainty: "Definite" | "Potential";
    description: string;
    file: string;
    vulnerableCode?: string;
    fixedCode?: string;
}

interface PRAnalysisResult {
    riskDelta: RiskDelta;
    regressions: SecurityRegression[];
    findings: Finding[];
    assumptions: string[];
}

async function getSessionAccessToken() {
    const session = await getServerSession(authOptions);
    return (session as any)?.accessToken as string | undefined;
}

async function fetchGitHub(url: string, accessToken?: string) {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
    };

    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`GitHub API error: ${res.status} ${text}`);
    }

    return res.json();
}

async function getPRFiles(
    owner: string,
    repo: string,
    prNumber: number,
    accessToken?: string
): Promise<PRFile[]> {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}/files`;
    return fetchGitHub(url, accessToken);
}

async function getPRDetails(
    owner: string,
    repo: string,
    prNumber: number,
    accessToken?: string
) {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}`;
    return fetchGitHub(url, accessToken);
}

async function getHistoricalPRs(
    owner: string,
    repo: string,
    accessToken?: string,
    limit: number = 50
) {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=closed&per_page=${limit}&sort=updated&direction=desc`;
    return fetchGitHub(url, accessToken);
}

function calculateRiskDelta(files: PRFile[]): RiskDelta {
    const changedFiles = {
        auth: 0,
        database: 0,
        api: 0,
        config: 0,
    };

    const reasons: string[] = [];
    let riskScore = 0;

    // Patterns indicating high-risk changes
    const authPatterns = /auth|login|session|jwt|token|password|credential/i;
    const dbPatterns = /database|query|sql|prisma|mongoose|sequelize|knex/i;
    const apiPatterns = /\/api\/|route\.ts|endpoint|controller/i;
    const configPatterns = /\.env|config|secret|key/i;

    for (const file of files) {
        const filename = file.filename.toLowerCase();
        const patch = file.patch || "";

        // Check for authentication changes
        if (authPatterns.test(filename) || authPatterns.test(patch)) {
            changedFiles.auth++;
            riskScore += 15;
            if (!reasons.includes("Authentication logic modified")) {
                reasons.push("Authentication logic modified");
            }
        }

        // Check for database changes
        if (dbPatterns.test(filename) || dbPatterns.test(patch)) {
            changedFiles.database++;
            riskScore += 12;
            if (!reasons.includes("Database access patterns changed")) {
                reasons.push("Database access patterns changed");
            }
        }

        // Check for API endpoint changes
        if (apiPatterns.test(filename)) {
            changedFiles.api++;
            riskScore += 10;
            if (!reasons.includes("Public API endpoints modified")) {
                reasons.push("Public API endpoints modified");
            }
        }

        // Check for config/secrets changes
        if (configPatterns.test(filename)) {
            changedFiles.config++;
            riskScore += 20;
            if (!reasons.includes("Configuration or secrets updated")) {
                reasons.push("Configuration or secrets updated");
            }
        }

        // Check for dangerous patterns in patches
        if (patch) {
            if (/eval\(|exec\(|innerHTML|dangerouslySetInnerHTML/i.test(patch)) {
                riskScore += 25;
                if (!reasons.includes("Potentially unsafe code patterns introduced")) {
                    reasons.push("Potentially unsafe code patterns introduced");
                }
            }

            if (/\+.*process\.env\[|hardcoded.*password|api.*key.*=.*"/i.test(patch)) {
                riskScore += 30;
                if (!reasons.includes("Potential secrets exposure detected")) {
                    reasons.push("Potential secrets exposure detected");
                }
            }
        }
    }

    // Add baseline reasons
    if (reasons.length === 0) {
        reasons.push("Standard code changes with no high-risk patterns detected");
    }

    // Normalize score to 0-100
    riskScore = Math.min(100, riskScore);

    // Determine risk level
    let level: "LOW" | "MEDIUM" | "HIGH";
    if (riskScore >= 60) {
        level = "HIGH";
    } else if (riskScore >= 30) {
        level = "MEDIUM";
    } else {
        level = "LOW";
    }

    return {
        score: riskScore,
        level,
        reasons,
        changedFiles,
    };
}

async function detectRegressions(
    owner: string,
    repo: string,
    prNumber: number,
    currentFiles: PRFile[],
    accessToken?: string
): Promise<SecurityRegression[]> {
    const regressions: SecurityRegression[] = [];

    try {
        // Get historical PRs
        const historicalPRs = await getHistoricalPRs(owner, repo, accessToken);

        // Look for security-related PRs in history
        const securityPRs = historicalPRs.filter((pr: any) => {
            const title = pr.title.toLowerCase();
            const body = (pr.body || "").toLowerCase();
            return (
                title.includes("security") ||
                title.includes("fix") ||
                title.includes("vulnerability") ||
                title.includes("cve") ||
                body.includes("security fix") ||
                body.includes("vulnerability")
            );
        });

        // Analyze current PR changes against historical security fixes
        for (const securityPR of securityPRs.slice(0, 20)) {
            // Limit to last 20 security PRs
            try {
                const historicalFiles = await getPRFiles(
                    owner,
                    repo,
                    securityPR.number,
                    accessToken
                );

                // Check if current PR touches the same files that were fixed before
                for (const currentFile of currentFiles) {
                    const matchingHistoricalFile = historicalFiles.find(
                        (hf: PRFile) => hf.filename === currentFile.filename
                    );

                    if (matchingHistoricalFile && currentFile.patch && matchingHistoricalFile.patch) {
                        // Simple heuristic: if current PR removes lines that were added in security fix
                        const securityFixAdditions = matchingHistoricalFile.patch
                            .split("\n")
                            .filter((line) => line.startsWith("+") && !line.startsWith("+++"));

                        const currentDeletions = currentFile.patch
                            .split("\n")
                            .filter((line) => line.startsWith("-") && !line.startsWith("---"));

                        // Check for potential regression (simplified check)
                        const potentialRegression = securityFixAdditions.some((addition) => {
                            const addedCode = addition.substring(1).trim();
                            return currentDeletions.some((deletion) => {
                                const deletedCode = deletion.substring(1).trim();
                                return addedCode === deletedCode && addedCode.length > 10; // Ignore trivial matches
                            });
                        });

                        if (potentialRegression) {
                            regressions.push({
                                id: `regression-${securityPR.number}-${currentFile.filename}`,
                                title: `Potential regression of security fix from PR #${securityPR.number}`,
                                description: `This PR modifies ${currentFile.filename}, which was previously fixed in PR #${securityPR.number} (${securityPR.title}). Review carefully to ensure the security fix is not being reverted.`,
                                originalFixPR: securityPR.number,
                                originalFixDate: securityPR.merged_at || securityPR.closed_at,
                                reintroducedIn: currentFile.filename,
                                severity: "HIGH",
                            });
                        }
                    }
                }
            } catch (err) {
                console.error(`Error analyzing historical PR #${securityPR.number}:`, err);
                // Continue with other PRs
            }
        }
    } catch (err) {
        console.error("Error detecting regressions:", err);
        // Return empty array if regression detection fails
    }

    return regressions;
}

async function analyzeWithGroq(files: PRFile[]): Promise<{ findings: Finding[]; assumptions: string[] }> {
    if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not configured");
    }

    // Prepare code context from PR files with token limit
    const MAX_CONTEXT_LENGTH = 8000; // Conservative limit to stay under 12k tokens
    let codeContext = files
        .filter((f) => f.patch)
        .map((f) => `File: ${f.filename}\nChanges:\n${f.patch}`)
        .join("\n\n---\n\n");

    // Truncate if too large
    if (codeContext.length > MAX_CONTEXT_LENGTH) {
        const truncatedFiles = files
            .filter((f) => f.patch)
            .slice(0, 10) // Limit to first 10 files
            .map((f) => {
                const patch = f.patch || "";
                const truncatedPatch = patch.length > 500 ? patch.substring(0, 500) + "\n... (truncated)" : patch;
                return `File: ${f.filename}\nChanges:\n${truncatedPatch}`;
            })
            .join("\n\n---\n\n");

        codeContext = truncatedFiles.substring(0, MAX_CONTEXT_LENGTH);
    }

    const systemPrompt = `You are CodeArmor AI, a conservative Senior DevSecOps Engineer analyzing a GitHub Pull Request for security vulnerabilities.

CERTAINTY CLASSIFICATION RULES (MANDATORY):

Label as "Definite Vulnerability" ONLY if ALL of these are true:
1. The vulnerability is DIRECTLY EXPLOITABLE in production
2. It involves at least ONE of:
   - Authentication bypass
   - Authorization failure (IDOR, privilege escalation)
   - SQL/NoSQL injection with user input
   - Hardcoded secrets ACTUALLY USED at runtime
   - Remote Code Execution
   - Sensitive data exposure to unauthorized users
   - Missing access control on public endpoints
3. NO assumptions are required to exploit it
4. It is NOT any of the following:
   - Feature flags (e.g., disableInputAttributeSyncing)
   - Configuration toggles
   - Environment-specific defaults
   - Build-time constants
   - Framework internal flags
   - Non-user-controlled values
   - Code paths unreachable in production

Label as "Potential Risk (Context Required)" if:
- You need to make ANY assumption about data flow
- It's a configuration that MIGHT be unsafe depending on usage
- It requires external context to determine exploitability
- It's a feature flag or toggle
- Severity is LOW (LOW findings are almost NEVER Definite)
- Variable origins or data flow are unclear
- Missing context about validation elsewhere
- Uncertainty about framework protections

SEVERITY ALIGNMENT:
- LOW severity findings should be "Potential Risk" unless absolutely certain
- HIGH severity requires clear evidence of exploitability to be "Definite"
- If you list assumptions, the finding MUST be "Potential Risk"

AVOID OVER-FLAGGING:
- Be conservative and honest
- If code looks safe, don't flag it
- Configuration changes are NOT vulnerabilities unless proven exploitable
- Focus on CHANGES in the PR, not existing code unless context is needed

RETURN JSON ONLY:
{
  "findings": [
    {
      "id": "unique_id",
      "title": "Short, clear title",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "certainty": "Definite" | "Potential",
      "description": "1-2 sentences explaining the issue in the PR changes",
      "file": "filename",
      "vulnerableCode": "The specific changed lines",
      "fixedCode": "Minimal secure alternative"
    }
  ],
  "assumptions": ["List every assumption you made during analysis"]
}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `Analyze this Pull Request for security issues:\n\n${codeContext}`,
                },
            ],
            response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Groq API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    const rawText = data?.choices?.[0]?.message?.content;

    if (!rawText) {
        throw new Error("Groq response was empty");
    }

    const parsed = JSON.parse(rawText);
    return {
        findings: parsed.findings || [],
        assumptions: parsed.assumptions || [],
    };
}

export async function POST(req: Request) {
    try {
        const { rateLimit } = await import("@/lib/rateLimit");
        const { validateOwnerRepo, validatePRNumber } = await import("@/lib/validation");
        const { saveScanHistory, saveRegression } = await import("@/lib/supabase");
        const session = await getServerSession(authOptions);

        const body: PRAnalysisRequest = await req.json();
        const { owner, repo, prNumber } = body;

        if (!owner || !repo || !prNumber) {
            return NextResponse.json(
                { error: "Missing required fields: owner, repo, prNumber" },
                { status: 400 }
            );
        }

        // Validate inputs
        if (!validateOwnerRepo(owner, repo) || !validatePRNumber(prNumber)) {
            return NextResponse.json(
                { error: "Invalid owner, repository name, or PR number." },
                { status: 400 }
            );
        }

        // Rate limiting
        const identifier = session?.user?.email || req.headers.get('x-forwarded-for') || 'anonymous';
        const rateLimitResult = rateLimit(identifier, 'pr');
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
                    }
                }
            );
        }

        const accessToken = await getSessionAccessToken();

        // 1. Get PR details and files
        const [prDetails, prFiles] = await Promise.all([
            getPRDetails(owner, repo, prNumber, accessToken),
            getPRFiles(owner, repo, prNumber, accessToken),
        ]);

        // 2. Calculate Risk Delta
        const riskDelta = calculateRiskDelta(prFiles);

        // 3. Detect Security Regressions
        const regressions = await detectRegressions(owner, repo, prNumber, prFiles, accessToken);

        // 4. Analyze with AI for vulnerabilities
        const { findings, assumptions } = await analyzeWithGroq(prFiles);

        const result: PRAnalysisResult = {
            riskDelta,
            regressions,
            findings,
            assumptions,
        };

        // Save to history if user is logged in
        if (session?.user?.email) {
            const definiteCount = findings.filter((f: any) => f.certainty === 'Definite').length;
            const potentialCount = findings.length - definiteCount;
            const score = Math.max(0, 100 - (riskDelta.score / 2)); // Rough score based on risk

            await saveScanHistory({
                user_id: session.user.email,
                user_email: session.user.email,
                scan_type: 'pr',
                target: `${owner}/${repo} PR #${prNumber}`,
                owner,
                repo,
                pr_number: prNumber,
                security_score: score,
                risk_level: riskDelta.level,
                findings_count: findings.length,
                definite_count: definiteCount,
                potential_count: potentialCount,
                regressions_count: regressions.length,
                scan_data: result
            }).catch(err => console.error('[History] Failed to save:', err));

            // Save regressions
            for (const regression of regressions) {
                await saveRegression({
                    user_id: session.user.email,
                    user_email: session.user.email,
                    owner,
                    repo,
                    pr_number: prNumber,
                    original_fix_pr: regression.originalFixPR,
                    file_affected: regression.reintroducedIn,
                    severity: regression.severity
                }).catch(err => console.error('[History] Failed to save regression:', err));
            }
        }

        return NextResponse.json(result, {
            headers: {
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
            }
        });
    } catch (error: any) {
        console.error("PR analysis error:", error.message);

        // Check if it's a token limit error
        if (error.message?.includes("413") || error.message?.includes("too large") || error.message?.includes("rate_limit_exceeded")) {
            return NextResponse.json(
                { error: "PR is too large to analyze. Please try analyzing a smaller PR or specific files." },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to analyze PR. Please try again." },
            { status: 500 }
        );
    }
}
