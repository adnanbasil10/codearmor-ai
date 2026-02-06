import { NextResponse } from "next/server";


const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_API_KEY = process.env.GROQ_API_KEY;


async function callGroqForSnippet(code: string) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const systemPrompt = `
    You are CodeArmor AI, a conservative Senior AppSec Engineer. Analyze code for OWASP Top 10 vulnerabilities.

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
          "vulnerableCode": "The specific lines",
          "fixedCode": "Minimal production-safe fix"
        }
      ],
      "assumptions": ["List of assumptions made during analysis"]
    }
  `;

  const url = "https://api.groq.com/openai/v1/chat/completions";

  const body = {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `CODE SNIPPET:\n\`\`\`\n${code}\n\`\`\`` }
    ],
    response_format: { type: "json_object" }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000) // 60 second timeout
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

    // Potential risks imply half penalty
    if (!isDefinite) {
      penalty = penalty / 2;
    }

    score -= penalty;
  });

  // Hard clamps for critical failures
  const hasDefiniteHigh = findings.some(f => f.severity === "HIGH" && f.certainty === "Definite");
  const hasSecrets = findings.some(f => f.title.toLowerCase().includes("secret") || f.title.toLowerCase().includes("key"));

  if (hasDefiniteHigh || hasSecrets) {
    // Ensure it drops below 50 if it was still high
    if (score > 45) score = 45;
  }

  return Math.max(0, Math.round(score));
}

function getStatus(score: number) {
  if (score >= 80) return { label: "Secure", emoji: "🟢", color: "text-emerald-400" };
  if (score >= 50) return { label: "Needs Attention", emoji: "🟡", color: "text-yellow-400" };
  return { label: "Critical", emoji: "🔴", color: "text-rose-400" };
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { sanitizeCode } from "@/lib/validation";
import { saveScanHistory } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const identifier = session?.user?.email || req.headers.get("x-forwarded-for") || "anonymous";

    // Rate limiting
    const rateLimitResult = rateLimit(identifier, "snippet");
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
          }
        }
      );
    }

    const { code } = await req.json();

    // Input validation
    const sanitizedCode = sanitizeCode(code);
    if (sanitizedCode.length === 0) {
      return NextResponse.json(
        { error: "Invalid code input." },
        { status: 400 }
      );
    }

    const analysis = await callGroqForSnippet(sanitizedCode);
    const score = calculateScore(analysis.findings);
    const status = getStatus(score);

    const result = {
      ...analysis,
      score,
      status
    };

    // Save to history if user is logged in
    // DISABLED: History feature temporarily disabled
    /*
    if (session?.user?.email) {
      const definiteCount = analysis.findings.filter((f: any) => f.certainty === 'Definite').length;
      const potentialCount = analysis.findings.length - definiteCount;
      
      await saveScanHistory({
        user_id: session.user.email,
        user_email: session.user.email,
        scan_type: 'snippet',
        target: sanitizedCode.substring(0, 100) + (sanitizedCode.length > 100 ? '...' : ''),
        security_score: score,
        risk_level: score >= 80 ? 'LOW' : score >= 50 ? 'MEDIUM' : 'HIGH',
        findings_count: analysis.findings.length,
        definite_count: definiteCount,
        potential_count: potentialCount,
        regressions_count: 0,
        scan_data: result
      }).catch(err => console.error('[History] Failed to save:', err));
    }
    */

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
      }
    });
  } catch (error: any) {
    console.error("[Snippet Analysis Error]", error.message);
    return NextResponse.json(
      { error: "Couldn't analyze the code snippet. Please try again." },
      { status: 500 }
    );
  }
}
