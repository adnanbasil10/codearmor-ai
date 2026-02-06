"use client";

import { useState, useEffect, useMemo } from "react";
import { signIn, useSession } from "next-auth/react";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Github,
  ArrowRight,
  Code2,
  Lock,
  Loader2,
  Terminal,
  Zap,
  ChevronDown,
  ChevronUp,
  Search,
  Globe,
  ExternalLink,
  GitPullRequest
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utility for Tailwind ---
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Finding {
  id?: string;
  title?: string;
  severity?: "HIGH" | "MEDIUM" | "LOW";
  certainty?: "Definite" | "Potential";
  description?: string;
  file?: string;
  vulnerableCode?: string;
  fixedCode?: string;
}

interface AnalysisResult {
  score: number;
  status: {
    label: string;
    emoji: string;
    color: string;
  };
  findings: Finding[];
  assumptions: string[];
  repo?: { owner: string; repo: string; branch: string };
}

interface GitHubRepo {
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  url: string;
}

// --- API Helper ---
async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error((data as any)?.error || res.statusText);
  }
  return res.json() as Promise<T>;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error((data as any)?.error || res.statusText);
  }
  return res.json() as Promise<T>;
}

// --- Components ---

function SecurityScore({ score, status }: { score: number; status: AnalysisResult["status"] }) {
  const isSecure = score >= 80;
  const isMedium = score >= 50 && score < 80;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0B0C15] border border-white/5 p-8 text-center group">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative z-10 flex flex-col items-center">
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center border-4 text-4xl font-bold mb-4 shadow-2xl backdrop-blur-md",
          isSecure ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10 shadow-emerald-500/20" :
            isMedium ? "border-amber-500/50 text-amber-400 bg-amber-500/10 shadow-amber-500/20" :
              "border-rose-500/50 text-rose-400 bg-rose-500/10 shadow-rose-500/20"
        )}>
          {score}
        </div>

        <h3 className={cn("text-xl font-bold flex items-center gap-2",
          isSecure ? "text-emerald-400" : isMedium ? "text-amber-400" : "text-rose-400"
        )}>
          {status.emoji} {status.label}
        </h3>
        <p className="text-slate-500 text-xs mt-2 font-medium tracking-wide">SECURITY SCORE</p>
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);
  const isDefinite = finding.certainty === "Definite";
  const isHigh = finding.severity === "HIGH";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative rounded-xl border p-5 transition-all duration-300",
        "bg-[#13141f] hover:bg-[#1a1b26]",
        isHigh ? "border-rose-900/30 hover:border-rose-700/50" : "border-white/5 hover:border-blue-500/30"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("p-2 rounded-lg shrink-0",
          isHigh ? "bg-rose-500/10 text-rose-400" : "bg-blue-500/10 text-blue-400"
        )}>
          {isHigh ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={cn(
              "px-2 py-0.5 text-[10px] font-bold tracking-wider rounded border",
              finding.severity === "HIGH" ? "border-rose-500/20 bg-rose-500/10 text-rose-400" :
                finding.severity === "MEDIUM" ? "border-amber-500/20 bg-amber-500/10 text-amber-400" :
                  "border-sky-500/20 bg-sky-500/10 text-sky-400"
            )}>
              {finding.severity}
            </span>

            {isDefinite && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wider rounded border border-rose-500/30 bg-rose-950/40 text-rose-200">
                <AlertTriangle className="w-3 h-3" /> DEFINITE VULNERABILITY
              </span>
            )}
          </div>

          <h4 className="font-semibold text-slate-200 text-base">{finding.title}</h4>

          {finding.file && (
            <p className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
              <FileCode className="w-3 h-3" /> {finding.file}
            </p>
          )}

          <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
            {finding.description}
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 mt-2"
          >
            {expanded ? "Hide Details" : "View Code Analysis"}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 grid lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-rose-900/20 bg-[#0f111a] overflow-hidden">
                <div className="bg-rose-950/10 px-4 py-2 border-b border-rose-900/20 text-xs text-rose-400 font-mono font-bold flex items-center justify-between">
                  <span>VULNERABLE CODE</span>
                </div>
                <pre className="p-4 text-[11px] font-mono text-rose-200/70 overflow-x-auto leading-relaxed scrollbar-thin scrollbar-thumb-rose-900/50">
                  {finding.vulnerableCode}
                </pre>
              </div>

              <div className="rounded-lg border border-emerald-900/20 bg-[#0f111a] overflow-hidden">
                <div className="bg-emerald-950/10 px-4 py-2 border-b border-emerald-900/20 text-xs text-emerald-400 font-mono font-bold flex items-center justify-between">
                  <span>SECURE IMPLEMENTATION</span>
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <pre className="p-4 text-[11px] font-mono text-emerald-200/70 overflow-x-auto leading-relaxed scrollbar-thin scrollbar-thumb-emerald-900/50">
                  {finding.fixedCode}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Main Analyzer ---

export function Analyzer() {
  const { status } = useSession();
  const [mode, setMode] = useState<"snippet" | "github">("snippet");

  // State
  const [inputCode, setInputCode] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // GitHub Repo Selection State
  const [repoSource, setRepoSource] = useState<"my-github" | "url">("url");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fix PR State
  const [fixing, setFixing] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && mode === "github") {
      setRepoSource("my-github");
      fetchRepos();
      setDropdownOpen(true);
    } else {
      setRepoSource("url");
      setDropdownOpen(false);
    }
  }, [status, mode]);

  async function fetchRepos() {
    setLoadingRepos(true);
    try {
      const data = await fetchJson<GitHubRepo[]>("/api/github/repos");
      setRepos(data);
    } catch (e) {
      console.error("Failed to fetch repos", e);
    } finally {
      setLoadingRepos(false);
    }
  }

  const filteredRepos = useMemo(() => {
    if (!searchQuery || selectedRepo) return repos;
    return repos.filter(repo =>
      repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [repos, searchQuery, selectedRepo]);

  function handleRepoSelect(repo: GitHubRepo) {
    setSelectedRepo(repo);
    setSearchQuery("");
    setDropdownOpen(false);
  }

  function clearSelectedRepo() {
    setSelectedRepo(null);
    setSearchQuery("");
    setDropdownOpen(true);
  }

  // Actions
  async function handleAnalyze() {
    if (mode === "snippet" && !inputCode.trim()) return;

    setLoading(true);
    setResult(null);
    setPrUrl(null);

    try {
      if (mode === "snippet") {
        const data = await postJson<AnalysisResult>("/api/analyze/snippet", { code: inputCode });
        setResult(data);
      } else {
        let owner = "";
        let repoName = "";

        if (repoSource === "my-github" && selectedRepo) {
          owner = selectedRepo.owner;
          repoName = selectedRepo.name;
        } else if (repoSource === "url") {
          // Parse GitHub URL
          const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
          if (match) {
            owner = match[1];
            repoName = match[2].replace(/\.git$/, "");
          } else {
            // Fallback to owner/repo format
            const [o, r] = repoUrl.split("/");
            owner = o;
            repoName = r;
          }
        }

        if (!owner || !repoName) throw new Error("Invalid repository selected or URL format");
        const data = await postJson<AnalysisResult>("/api/analyze/github", { owner, repo: repoName });
        setResult(data);
      }
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFix() {
    if (!result || mode !== "github" || !result.findings.length) return;
    const definiteFindings = result.findings.filter(f => f.certainty === "Definite");
    if (!definiteFindings.length) return alert("No definite vulnerabilities to fix.");

    if (!confirm(`This will create a Pull Request fixing ${definiteFindings.length} vulnerabilities. Continue?`)) return;

    setFixing(true);
    try {
      const owner = result.repo?.owner;
      const repo = result.repo?.repo;
      const res = await postJson<{ success: boolean; prUrl: string }>("/api/fix/github", {
        owner, repo, findings: result.findings
      });
      if (res.success) {
        setPrUrl(res.prUrl);
      }
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setFixing(false);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">

      {/* 1. INPUT PANEL */}
      <section className="bg-[#0B0C15] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 opacity-50" />

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setMode("snippet")}
            className={cn("px-8 py-4 text-sm font-medium flex items-center gap-2 transition-colors", mode === "snippet" ? "text-white bg-white/5 border-r border-white/5" : "text-slate-500 hover:text-slate-200")}
          >
            <Code2 className="w-4 h-4" /> Paste Code
          </button>
          <button
            onClick={() => setMode("github")}
            className={cn("px-8 py-4 text-sm font-medium flex items-center gap-2 transition-colors", mode === "github" ? "text-white bg-white/5 border-r border-l border-white/5" : "text-slate-500 hover:text-slate-200")}
          >
            <Github className="w-4 h-4" /> Scan Repository
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {mode === "snippet" ? (
            <textarea
              value={inputCode}
              onChange={e => setInputCode(e.target.value)}
              placeholder="// Paste your Python, JS, or Go code here..."
              className="w-full h-[350px] bg-[#050505] border border-white/10 rounded-xl p-6 text-sm font-mono text-slate-300 outline-none focus:border-cyan-500/50 resize-none transition-colors placeholder:text-slate-700"
              spellCheck={false}
            />
          ) : (
            <div className="min-h-[350px] flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Github className="w-6 h-6 text-slate-400" />
              </div>

              <div className="max-w-xl w-full space-y-8">
                {status === "authenticated" && (
                  <div className="flex items-center justify-center gap-1 p-1 bg-[#050505] border border-white/5 rounded-xl w-fit mx-auto">
                    <button
                      onClick={() => setRepoSource("my-github")}
                      className={cn(
                        "px-4 py-2 text-xs font-semibold rounded-lg transition-all",
                        repoSource === "my-github" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      Select from my GitHub
                    </button>
                    <button
                      onClick={() => setRepoSource("url")}
                      className={cn(
                        "px-4 py-2 text-xs font-semibold rounded-lg transition-all",
                        repoSource === "url" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      Paste repo URL
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  {repoSource === "my-github" ? (
                    <div className="space-y-4">
                      {selectedRepo ? (
                        <div className="bg-[#050505] border border-cyan-500/30 rounded-xl p-4 flex items-center justify-between group hover:border-cyan-500/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
                              <Github className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-cyan-400">{selectedRepo.name}</p>
                              <p className="text-xs text-slate-500">{selectedRepo.owner}</p>
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ml-2",
                              selectedRepo.private ? "border-amber-500/20 bg-amber-500/10 text-amber-500" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                            )}>
                              {selectedRepo.private ? <Lock className="w-2.5 h-2.5 inline mr-1" /> : <Globe className="w-2.5 h-2.5 inline mr-1" />}
                              {selectedRepo.private ? "PRIVATE" : "PUBLIC"}
                            </span>
                          </div>
                          <button
                            onClick={clearSelectedRepo}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            title="Change repository"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="text"
                              placeholder="Search your repositories..."
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setDropdownOpen(true);
                              }}
                              onFocus={() => setDropdownOpen(true)}
                              className="w-full bg-[#050505] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-500/50 transition-colors"
                            />
                          </div>

                          {dropdownOpen && (
                            <div className="bg-[#050505] border border-white/10 rounded-xl max-h-[220px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10">
                              {loadingRepos ? (
                                <div className="p-12 flex flex-col items-center justify-center gap-3">
                                  <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                                  <p className="text-xs text-slate-500">Fetching your repositories...</p>
                                </div>
                              ) : filteredRepos.length > 0 ? (
                                <div className="grid grid-cols-1 divide-y divide-white/5">
                                  {filteredRepos.map((repo) => (
                                    <button
                                      key={repo.fullName}
                                      onClick={() => handleRepoSelect(repo)}
                                      className="flex items-center justify-between p-4 transition-colors w-full text-left group hover:bg-white/5"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-md bg-white/5 text-slate-500 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                                          <Github className="w-4 h-4" />
                                        </div>
                                        <div className="overflow-hidden">
                                          <p className="text-sm font-semibold truncate text-slate-200 group-hover:text-cyan-400 transition-colors">
                                            {repo.name}
                                          </p>
                                          <p className="text-[10px] text-slate-500 truncate">{repo.owner}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className={cn(
                                          "px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider border",
                                          repo.private ? "border-amber-500/20 bg-amber-500/10 text-amber-500" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                        )}>
                                          {repo.private ? <Lock className="w-2.5 h-2.5 inline mr-1" /> : <Globe className="w-2.5 h-2.5 inline mr-1" />}
                                          {repo.private ? "PRIVATE" : "PUBLIC"}
                                        </span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-12 text-center">
                                  <p className="text-sm text-slate-500">No repositories found matching your search.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative group">
                        <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                        <input
                          value={repoUrl}
                          onChange={e => setRepoUrl(e.target.value)}
                          placeholder="https://github.com/username/repo"
                          className="w-full bg-[#050505] border border-white/10 rounded-xl pl-11 pr-4 py-4 text-sm text-slate-200 outline-none focus:border-cyan-500/50 transition-colors shadow-inner"
                        />
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                        <p className="text-xs text-slate-500">Public repositories supported without login</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={loading || (mode === "github" && repoSource === "my-github" && !selectedRepo) || (mode === "github" && repoSource === "url" && !repoUrl.includes("github.com/"))}
              className={cn(
                "px-10 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center gap-2",
                loading || (mode === "github" && repoSource === "my-github" && !selectedRepo) || (mode === "github" && repoSource === "url" && !repoUrl.includes("github.com/"))
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                  : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-cyan-500/20 hover:scale-[1.02] transform"
              )}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-cyan-300 fill-current" />}
              {loading ? "Analyzing..." : "Run Security Analysis"}
            </button>
          </div>
        </div>
      </section>

      {/* 2. RESULTS AREA */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-[1fr_360px] gap-8 items-start"
          >
            {/* Left: Findings */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-slate-500" /> Analysis Findings
                </h3>

                {/* FIX ACTION */}
                {mode === "github" && result.findings.some(f => f.certainty === "Definite") && (
                  <button
                    onClick={handleFix}
                    disabled={fixing}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2"
                  >
                    {fixing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
                    {fixing ? "Creating PR..." : "Fix Definite Issues"}
                  </button>
                )}
              </div>

              {/* PR Success Message */}
              {prUrl && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-full text-emerald-400 rotate-12 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-emerald-400 font-bold text-sm">Pull Request Created</h4>
                      <p className="text-emerald-500/70 text-xs mt-0.5">Security fixes have been pushed securely to your repository.</p>
                    </div>
                  </div>
                  <a href={prUrl} target="_blank" className="px-5 py-2.5 bg-emerald-500 text-black font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                    View PR <ExternalLink className="w-3 h-3" />
                  </a>
                </motion.div>
              )}

              <div className="space-y-4">
                {result.findings.length === 0 && (
                  <div className="p-20 text-center border border-dashed border-white/10 rounded-3xl bg-[#0B0C15]/50 flex flex-col items-center gap-4">
                    <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-white font-bold">No Vulnerabilities Detected</h4>
                      <p className="text-slate-500 text-sm">Your code baseline appears to be healthy and secure.</p>
                    </div>
                  </div>
                )}
                {result.findings.map((f, i) => (
                  <FindingCard key={i} finding={f} />
                ))}
              </div>

              {/* Assumptions */}
              <div className="border-t border-white/5 pt-8 mt-8">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 opacity-70">Analysis Context & Assumptions</h4>
                <ul className="space-y-3">
                  {result.assumptions.map((a, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-3 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 mt-1.5 flex-shrink-0" /> {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Score Sticky */}
            <div className="lg:sticky lg:top-8 space-y-6">
              <SecurityScore score={result.score} status={result.status} />

              <div className="bg-[#0B0C15] border border-white/5 p-8 rounded-3xl space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Terminal className="w-20 h-20 rotate-12" />
                </div>

                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Metrics Breakdown</h4>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">Definite Vulnerabilities</span>
                    <span className="font-mono font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {result.findings.filter(f => f.certainty === "Definite").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">Potential Risks</span>
                    <span className="font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {result.findings.filter(f => f.certainty !== "Definite").length}
                    </span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent my-6" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium tracking-tight">Scope</span>
                    <span className="font-mono font-bold text-slate-300 flex items-center gap-1.5">
                      {mode === "snippet" ? <Code2 className="w-3.5 h-3.5" /> : <Github className="w-3.5 h-3.5" />}
                      {mode === "snippet" ? "Single Snippet" : "Entire Repository"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
