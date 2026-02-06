import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const GITHUB_API_BASE = "https://api.github.com";

interface RepoRequestBody {
  owner?: string;
  repo?: string;
  branch?: string;
}

interface RepoFile {
  path: string;
  content: string;
}

async function getSessionAccessToken() {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.accessToken as string | undefined;
  return accessToken;
}

async function fetchJson(url: string, accessToken?: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json"
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30000) // 30 second timeout
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${text}`);
  }
  return res.json();
}

async function fetchRepoTree(
  owner: string,
  repo: string,
  branch: string,
  accessToken?: string
) {
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(
    owner
  )}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(
    branch
  )}?recursive=1`;

  const data = (await fetchJson(url, accessToken)) as any;
  return Array.isArray(data?.tree) ? data.tree : [];
}

async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  accessToken?: string
): Promise<RepoFile | null> {
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(
    owner
  )}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(path)}`;

  const data = (await fetchJson(url, accessToken)) as any;
  if (!data) return null;
  if (data.type !== "file" || !data.content) return null;

  const buffer = Buffer.from(data.content, "base64");
  return {
    path,
    content: buffer.toString("utf-8")
  };
}

async function collectFilesFromRepo(
  { owner, repo, branch }: { owner: string; repo: string; branch: string },
  accessToken?: string
): Promise<RepoFile[]> {
  const tree = await fetchRepoTree(owner, repo, branch, accessToken);
  const wanted: string[] = [];

  for (const item of tree) {
    if (item.type !== "blob" || typeof item.path !== "string") continue;
    const path: string = item.path;

    if (path === "app/page.tsx") wanted.push(path);
    if (path === "middleware.ts") wanted.push(path);
    if (path === ".env.example") wanted.push(path);
    if (path.startsWith("app/api/") && path.endsWith("route.ts")) wanted.push(path);
    if (path.startsWith("supabase/") && path.endsWith(".sql")) wanted.push(path);
  }

  const uniquePaths = Array.from(new Set(wanted));
  const results: RepoFile[] = [];

  for (const path of uniquePaths) {
    const file = await fetchFileContent(owner, repo, path, accessToken);
    if (file) {
      results.push(file);
    }
  }

  return results;
}



async function callGroqForRepo(files: RepoFile[]) {
  const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const systemPrompt = `
    You are CodeArmor AI, a conservative Senior DevSecOps Engineer. Analyze the codebase for OWASP Top 10 vulnerabilities.

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
       - Feature flags
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
    - It's a feature flag or toggle (e.g., disableInputAttributeSyncing)
    - Severity is LOW (LOW findings are almost never Definite)

    SEVERITY ALIGNMENT:
    - LOW severity findings should be "Potential Risk" unless absolutely certain
    - HIGH severity requires clear evidence of exploitability to be "Definite"
    - If you list assumptions, the finding MUST be "Potential Risk"

    AVOID OVER-FLAGGING:
    - Be conservative and honest
    - If code looks safe, don't flag it
    - Configuration changes are NOT vulnerabilities unless proven exploitable

    RETURN JSON ONLY:
    {
      "findings": [
        {
          "id": "unique_id",
          "title": "Short Title",
          "severity": "HIGH" | "MEDIUM" | "LOW",
          "certainty": "Definite" | "Potential",
          "description": "1-2 sentences explaining the issue.",
          "file": "path/to/file",
          "vulnerableCode": "The specific lines",
          "fixedCode": "Minimal production-safe fix"
        }
      ],
      "assumptions": ["List of assumptions made"]
    }
  `;

  const filesText = files
    .map(
      (file) =>
        `FILE: ${file.path}\n----------------\n${file.content.trim()}\n\n`
    )
    .join("\n");

  const url = "https://api.groq.com/openai/v1/chat/completions";

  const body = {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `CODEBASE SNAPSHOT:\n${filesText}` }
    ],
    response_format: { type: "json_object" }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as any;
  const rawText = data?.choices?.[0]?.message?.content;

  if (!rawText) throw new Error("Groq response was empty.");

  try {
    const json = JSON.parse(rawText);
    return {
      findings: Array.isArray(json.findings) ? json.findings : [],
      assumptions: Array.isArray(json.assumptions) ? json.assumptions : []
    };
  } catch (err) {
    console.error("JSON Parse Error:", rawText);
    throw new Error("Failed to parse analysis results.");
  }
}

function calculateScore(findings: any[]) {
  let score = 100;

  findings.forEach(f => {
    let penalty = 0;
    const isDefinite = f.certainty === "Definite";

    switch (f.severity) {
      case "HIGH": penalty = 30; break;
      case "MEDIUM": penalty = 15; break;
      case "LOW": penalty = 5; break;
    }

    if (!isDefinite) {
      penalty = penalty / 2;
    }

    score -= penalty;
  });

  const hasDefiniteHigh = findings.some(f => f.severity === "HIGH" && f.certainty === "Definite");
  const hasSecrets = findings.some(f => f.title.toLowerCase().includes("secret") || f.title.toLowerCase().includes("key"));

  if (hasDefiniteHigh || hasSecrets) {
    if (score > 45) score = 45;
  }

  return Math.max(0, Math.round(score));
}

function getStatus(score: number) {
  if (score >= 80) return { label: "Secure", emoji: "🟢", color: "text-emerald-400" };
  if (score >= 50) return { label: "Needs Attention", emoji: "🟡", color: "text-yellow-400" };
  return { label: "Insecure", emoji: "🔴", color: "text-red-500" };
}

export async function POST(req: Request) {
  try {
    const { rateLimit } = await import("@/lib/rateLimit");
    const { validateOwnerRepo } = await import("@/lib/validation");
    const { saveScanHistory } = await import("@/lib/supabase");
    const session = await getServerSession(authOptions);

    const accessToken = await getSessionAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required for GitHub repo analysis." },
        { status: 401 }
      );
    }

    // Rate limiting
    const identifier = session?.user?.email || 'anonymous';
    const rateLimitResult = rateLimit(identifier, 'repo');
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

    const body = (await req.json()) as RepoRequestBody;
    const owner = (body.owner || "").trim();
    const repo = (body.repo || "").trim();
    const branch = (body.branch || "main").trim();

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing `owner` or `repo` in request body." },
        { status: 400 }
      );
    }

    // Validate owner/repo format
    if (!validateOwnerRepo(owner, repo)) {
      return NextResponse.json(
        { error: "Invalid owner or repository name." },
        { status: 400 }
      );
    }

    const files = await collectFilesFromRepo({ owner, repo, branch }, accessToken);
    if (!files.length) {
      return NextResponse.json(
        { error: "No target files found in repository." },
        { status: 404 }
      );
    }

    const analysis = await callGroqForRepo(files);
    const score = calculateScore(analysis.findings);
    const status = getStatus(score);

    const result = {
      repo: { owner, repo, branch },
      files: files.map((f) => f.path),
      ...analysis,
      score,
      status
    };

    // Save to history if user is logged in
    if (session?.user?.email) {
      const definiteCount = analysis.findings.filter((f: any) => f.certainty === 'Definite').length;
      const potentialCount = analysis.findings.length - definiteCount;

      await saveScanHistory({
        user_id: session.user.email,
        user_email: session.user.email,
        scan_type: 'repo',
        target: `${owner}/${repo}`,
        owner,
        repo,
        security_score: score,
        risk_level: score >= 80 ? 'LOW' : score >= 50 ? 'MEDIUM' : 'HIGH',
        findings_count: analysis.findings.length,
        definite_count: definiteCount,
        potential_count: potentialCount,
        regressions_count: 0,
        scan_data: result
      }).catch(err => console.error('[History] Failed to save:', err));
    }

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
      }
    });
  } catch (error: any) {
    console.error("[analyze/github] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to analyze GitHub repository. Please try again." },
      { status: 500 }
    );
  }
}

