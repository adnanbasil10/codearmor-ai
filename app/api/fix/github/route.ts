
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const GITHUB_API_BASE = "https://api.github.com";

// --- Helpers (Duplicated to avoid fragile imports) ---

async function getSessionAccessToken() {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken as string | undefined;
    return accessToken;
}

async function fetchJson(url: string, accessToken: string, method = "GET", body?: any) {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28"
    };

    const opts: RequestInit = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`GitHub API error [${method} ${url}]: ${res.status} ${text}`);
    }
    return res.json();
}

async function getRef(owner: string, repo: string, ref: string, accessToken: string) {
    try {
        const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/${ref}`;
        return await fetchJson(url, accessToken);
    } catch (e) {
        return null;
    }
}

async function createBranch(owner: string, repo: string, baseSha: string, newBranchName: string, accessToken: string) {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs`;
    return await fetchJson(url, accessToken, "POST", {
        ref: `refs/heads/${newBranchName}`,
        sha: baseSha
    });
}

async function updateFile(owner: string, repo: string, path: string, content: string, message: string, branch: string, sha: string, accessToken: string) {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;
    const body = {
        message,
        content: Buffer.from(content).toString("base64"),
        branch,
        sha
    };
    return await fetchJson(url, accessToken, "PUT", body);
}

async function getFileSha(owner: string, repo: string, path: string, branch: string, accessToken: string) {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const data = await fetchJson(url, accessToken);
    return data.sha;
}

async function createPR(owner: string, repo: string, head: string, base: string, title: string, body: string, accessToken: string) {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls`;
    return await fetchJson(url, accessToken, "POST", { title, body, head, base });
}

// --- Groq Fixer ---

async function generateFixForFile(code: string, findings: any[]) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const systemPrompt = `
        You are a Senior Security Engineer. 
        Your task is to FIX the following security vulnerabilities in the provided code file.
        
        VULNERABILITIES TO FIX:
        ${JSON.stringify(findings.map(f => f.title + ": " + f.description), null, 2)}

        RULES:
        1. Apply minimal, production-safe fixes.
        2. Do NOT change unrelated code.
        3. Do NOT break existing logic.
        4. Return ONLY the full content of the fixed file. No Markdown fences.
    `;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: code }
            ]
        })
    });

    const data = await res.json();
    let fixedCode = data.choices?.[0]?.message?.content || "";

    // Strip markdown fences if present
    fixedCode = fixedCode.replace(/^```[\w]*\n/, "").replace(/\n```$/, "");
    return fixedCode;
}

export async function POST(req: Request) {
    try {
        const accessToken = await getSessionAccessToken();
        if (!accessToken) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const body = await req.json();
        const { owner, repo, findings, branch = "main" } = body;

        // 1. Filter Definite Findings
        const definiteFindings = findings.filter((f: any) => f.certainty === "Definite");

        if (definiteFindings.length === 0) {
            return NextResponse.json({ message: "No definite vulnerabilities to fix." });
        }

        // 2. Group by file
        const filesToFix: Record<string, any[]> = {};
        definiteFindings.forEach((f: any) => {
            if (!filesToFix[f.file]) filesToFix[f.file] = [];
            filesToFix[f.file].push(f);
        });

        // 3. Create Branch
        // Check if branch exists, if not create from main
        const fixBranchName = `codearmor/security-fixes-${Date.now()}`;
        const mainRef = await getRef(owner, repo, `heads/${branch}`, accessToken);

        if (!mainRef) {
            throw new Error(`Could not find base branch ${branch}`);
        }

        await createBranch(owner, repo, mainRef.object.sha, fixBranchName, accessToken);

        // 4. Fix Files & Commit
        const fixedFiles = [];

        for (const [filePath, fileFindings] of Object.entries(filesToFix)) {
            // Fetch current content
            const fileUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
            const fileDataRes = await fetch(fileUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
            const fileData = await fileDataRes.json();
            const currentContent = Buffer.from(fileData.content, "base64").toString("utf-8");

            // Generate Fix
            const newContent = await generateFixForFile(currentContent, fileFindings as any[]);

            // Commit (Update File)
            // We need the SHA from the NEW branch? No, wait, if we just created the branch, 
            // the file has the same SHA as main.
            // But if we update multiple files, we need to be careful? 
            // Git API update-file creates a commit. 
            // So for the first file, base SHA is from main. 
            // For subsequent files/commits, it shouldn't matter as long as we point to the right branch name.

            await updateFile(
                owner,
                repo,
                filePath,
                newContent,
                `Security Fix: Resolved ${fileFindings.length} vulnerabilities`,
                fixBranchName,
                fileData.sha,
                accessToken
            );

            fixedFiles.push(filePath);
        }

        // 5. Create PR
        const pr = await createPR(
            owner,
            repo,
            fixBranchName,
            branch,
            "🛡️ CodeArmor Security Fixes",
            `## Security Improvements\n\nCodeArmor AI has automatically identified and fixed **${definiteFindings.length} definite vulnerabilities** in the following files:\n\n${fixedFiles.map(f => `- \`${f}\``).join("\n")}\n\n### Please review carefully before merging.`,
            accessToken
        );

        return NextResponse.json({
            success: true,
            prUrl: pr.html_url,
            fixedCount: definiteFindings.length
        });

    } catch (error: any) {
        console.error("Fix API Error:", error.message);
        return NextResponse.json({ error: "Couldn't create the fix PR. Please check your permissions and try again." }, { status: 500 });
    }
}
