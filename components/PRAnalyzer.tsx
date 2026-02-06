"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
    AlertTriangle,
    Shield,
    TrendingUp,
    FileCode,
    GitPullRequest,
    Loader2,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Info,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
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
    score: number;
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

function RiskDeltaCard({ riskDelta }: { riskDelta: RiskDelta }) {
    const isHigh = riskDelta.level === "HIGH";
    const isMedium = riskDelta.level === "MEDIUM";
    const isLow = riskDelta.level === "LOW";

    return (
        <div className="bg-[#0B0C15] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div
                className={cn(
                    "absolute top-0 left-0 w-full h-1",
                    isHigh ? "bg-rose-500" : isMedium ? "bg-amber-500" : "bg-emerald-500"
                )}
            />

            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        PR Risk Delta
                    </h3>
                    <p className="text-xs text-slate-500">Security impact assessment for this pull request</p>
                </div>

                <div
                    className={cn(
                        "px-4 py-2 rounded-xl font-bold text-sm border-2",
                        isHigh
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                            : isMedium
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    )}
                >
                    {riskDelta.level} RISK
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Auth", value: riskDelta.changedFiles.auth, icon: Shield },
                    { label: "Database", value: riskDelta.changedFiles.database, icon: FileCode },
                    { label: "API", value: riskDelta.changedFiles.api, icon: GitPullRequest },
                    { label: "Config", value: riskDelta.changedFiles.config, icon: AlertCircle },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-cyan-500/30 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <item.icon className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                        </div>
                        <div className="text-xl font-bold text-white">{item.value}</div>
                    </div>
                ))}
            </div>

            <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Factors</h4>
                <ul className="space-y-2">
                    {riskDelta.reasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <div
                                className={cn(
                                    "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                                    isHigh ? "bg-rose-500" : isMedium ? "bg-amber-500" : "bg-emerald-500"
                                )}
                            />
                            {reason}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function RegressionCard({ regression }: { regression: SecurityRegression }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-950/20 border-2 border-rose-500/30 rounded-xl p-5 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <AlertTriangle className="w-16 h-16" />
            </div>

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-rose-500/20 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-rose-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-rose-400 text-sm">Security Regression Detected</h4>
                            <p className="text-xs text-rose-500/70">
                                Originally fixed in PR #{regression.originalFixPR}
                            </p>
                        </div>
                    </div>

                    <span className="px-2 py-1 bg-rose-500/20 border border-rose-500/30 rounded text-[10px] font-bold text-rose-400">
                        {regression.severity}
                    </span>
                </div>

                <p className="text-sm text-slate-300 mb-3">{regression.description}</p>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>File: {regression.reintroducedIn}</span>
                    <span>•</span>
                    <span>Fixed: {new Date(regression.originalFixDate).toLocaleDateString()}</span>
                </div>
            </div>
        </motion.div>
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
                "rounded-xl border p-5 transition-all",
                "bg-[#13141f]",
                isHigh ? "border-rose-900/30" : "border-white/5"
            )}
        >
            <div className="flex items-start gap-4">
                <div
                    className={cn(
                        "p-2 rounded-lg shrink-0",
                        isHigh ? "bg-rose-500/10 text-rose-400" : "bg-blue-500/10 text-blue-400"
                    )}
                >
                    {isDefinite ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                </div>

                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span
                            className={cn(
                                "px-2 py-0.5 text-[10px] font-bold tracking-wider rounded border",
                                finding.severity === "HIGH"
                                    ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                                    : finding.severity === "MEDIUM"
                                        ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                                        : "border-sky-500/20 bg-sky-500/10 text-sky-400"
                            )}
                        >
                            {finding.severity}
                        </span>

                        <span
                            className={cn(
                                "px-2 py-0.5 text-[10px] font-bold tracking-wider rounded border",
                                isDefinite
                                    ? "border-rose-500/30 bg-rose-950/40 text-rose-200"
                                    : "border-amber-500/30 bg-amber-950/40 text-amber-200"
                            )}
                        >
                            {finding.certainty === "Definite" ? "DEFINITE VULNERABILITY" : "POTENTIAL RISK"}
                        </span>
                    </div>

                    <h4 className="font-semibold text-slate-200 text-base">{finding.title}</h4>

                    <p className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
                        <FileCode className="w-3 h-3" /> {finding.file}
                    </p>

                    <p className="text-sm text-slate-400 leading-relaxed">{finding.description}</p>

                    {(finding.vulnerableCode || finding.fixedCode) && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 mt-2"
                        >
                            {expanded ? "Hide Code" : "View Code"}
                            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-4"
                    >
                        <div className="grid lg:grid-cols-2 gap-4">
                            {finding.vulnerableCode && (
                                <div className="rounded-lg border border-rose-900/20 bg-[#0f111a] overflow-hidden">
                                    <div className="bg-rose-950/10 px-4 py-2 border-b border-rose-900/20 text-xs text-rose-400 font-mono font-bold">
                                        VULNERABLE CODE
                                    </div>
                                    <pre className="p-4 text-[11px] font-mono text-rose-200/70 overflow-x-auto leading-relaxed">
                                        {finding.vulnerableCode}
                                    </pre>
                                </div>
                            )}

                            {finding.fixedCode && (
                                <div className="rounded-lg border border-emerald-900/20 bg-[#0f111a] overflow-hidden">
                                    <div className="bg-emerald-950/10 px-4 py-2 border-b border-emerald-900/20 text-xs text-emerald-400 font-mono font-bold flex items-center justify-between">
                                        <span>SECURE IMPLEMENTATION</span>
                                        <CheckCircle2 className="w-3 h-3" />
                                    </div>
                                    <pre className="p-4 text-[11px] font-mono text-emerald-200/70 overflow-x-auto leading-relaxed">
                                        {finding.fixedCode}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export function PRAnalyzer() {
    const { status } = useSession();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PRAnalysisResult | null>(null);

    const [owner, setOwner] = useState("");
    const [repo, setRepo] = useState("");
    const [prNumber, setPrNumber] = useState("");

    async function handleAnalyze() {
        if (!owner || !repo || !prNumber) return;

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch("/api/analyze/pr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    owner,
                    repo,
                    prNumber: parseInt(prNumber),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to analyze PR");
            }

            const data = await res.json();
            setResult(data);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8">
            {/* Input Section */}
            <section className="bg-[#0B0C15] border border-white/5 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 opacity-50" />

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                        <GitPullRequest className="w-6 h-6 text-cyan-400" />
                        Pull Request Security Analysis
                    </h2>
                    <p className="text-sm text-slate-400">
                        Detect regressions, calculate risk delta, and identify vulnerabilities
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Owner (e.g., facebook)"
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        className="bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-500/50 transition-colors"
                    />
                    <input
                        type="text"
                        placeholder="Repository (e.g., react)"
                        value={repo}
                        onChange={(e) => setRepo(e.target.value)}
                        className="bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-500/50 transition-colors"
                    />
                    <input
                        type="number"
                        placeholder="PR Number (e.g., 12345)"
                        value={prNumber}
                        onChange={(e) => setPrNumber(e.target.value)}
                        className="bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-500/50 transition-colors"
                    />
                </div>

                <button
                    onClick={handleAnalyze}
                    disabled={loading || !owner || !repo || !prNumber}
                    className={cn(
                        "w-full px-8 py-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2",
                        loading || !owner || !repo || !prNumber
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-cyan-500/20 hover:scale-[1.02]"
                    )}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing Pull Request...
                        </>
                    ) : (
                        <>
                            <Shield className="w-4 h-4" />
                            Run Security Analysis
                        </>
                    )}
                </button>
            </section>

            {/* Results Section */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* 1. Risk Delta */}
                        <RiskDeltaCard riskDelta={result.riskDelta} />

                        {/* 2. Regressions */}
                        {result.regressions.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                                    Security Regressions ({result.regressions.length})
                                </h3>
                                {result.regressions.map((regression) => (
                                    <RegressionCard key={regression.id} regression={regression} />
                                ))}
                            </div>
                        )}

                        {/* 3. Findings */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileCode className="w-5 h-5 text-slate-500" />
                                Security Findings ({result.findings.length})
                            </h3>

                            {result.findings.length === 0 ? (
                                <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-[#0B0C15]/50">
                                    <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400 w-fit mx-auto mb-4">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-white font-bold mb-1">No Vulnerabilities Detected</h4>
                                    <p className="text-slate-500 text-sm">This PR appears to be secure</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {result.findings.map((finding) => (
                                        <FindingCard key={finding.id} finding={finding} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 4. Assumptions */}
                        {result.assumptions.length > 0 && (
                            <div className="bg-[#0B0C15] border border-white/5 rounded-2xl p-6">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Info className="w-3.5 h-3.5" />
                                    Analysis Assumptions
                                </h4>
                                <ul className="space-y-3">
                                    {result.assumptions.map((assumption, i) => (
                                        <li key={i} className="text-xs text-slate-400 flex items-start gap-3 leading-relaxed">
                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 mt-1.5 flex-shrink-0" />
                                            {assumption}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
