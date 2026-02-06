"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AuthStatus } from "@/components/AuthStatus";
import {
    ShieldCheck,
    ArrowLeft,
    Clock,
    FileCode,
    GitPullRequest,
    AlertTriangle,
    Loader2,
    Github,
} from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";

interface ScanHistory {
    id: string;
    scan_type: string;
    target: string;
    owner?: string;
    repo?: string;
    pr_number?: number;
    security_score: number;
    risk_level: string;
    findings_count: number;
    definite_count: number;
    potential_count: number;
    regressions_count: number;
    created_at: string;
}

interface PRFix {
    id: string;
    owner: string;
    repo: string;
    pr_number: number;
    pr_url: string;
    fixes_applied: number;
    status: string;
    created_at: string;
}

interface RegressionDetected {
    id: string;
    owner: string;
    repo: string;
    pr_number: number;
    original_fix_pr: number;
    file_affected: string;
    severity: string;
    detected_at: string;
}

export default function HistoryPage() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
    const [prFixes, setPrFixes] = useState<PRFix[]>([]);
    const [regressions, setRegressions] = useState<RegressionDetected[]>([]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchHistory();
        } else if (status === "unauthenticated") {
            setLoading(false);
        }
    }, [status]);

    async function fetchHistory() {
        try {
            const res = await fetch("/api/history");
            if (res.ok) {
                const data = await res.json();
                setScanHistory(data.scanHistory || []);
                setPrFixes(data.prFixes || []);
                setRegressions(data.regressions || []);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    }

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen bg-[#0b0f19] text-gray-100">
                <nav className="fixed top-0 inset-x-0 z-50 bg-[#0b0f19]/80 backdrop-blur-lg border-b border-gray-800">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="bg-cyan-500/20 p-1.5 rounded-lg text-cyan-400">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-lg tracking-tight text-white">
                                CodeArmor <span className="text-cyan-400">AI</span>
                            </span>
                        </Link>
                        <AuthStatus />
                    </div>
                </nav>

                <main className="pt-32 pb-24 px-6">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="p-6 bg-[#0B0C15] border border-white/5 rounded-2xl">
                            <div className="p-4 bg-cyan-500/10 rounded-full text-cyan-400 w-fit mx-auto mb-6">
                                <Clock className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Login Required</h2>
                            <p className="text-slate-400 mb-6">
                                Sign in with GitHub to view your security scan history
                            </p>
                            <button
                                onClick={() => signIn("github")}
                                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-2 mx-auto"
                            >
                                <Github className="w-4 h-4" />
                                Sign in with GitHub
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0f19] text-gray-100">
            {/* Header */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-[#0b0f19]/80 backdrop-blur-lg border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="bg-cyan-500/20 p-1.5 rounded-lg text-cyan-400">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-lg tracking-tight text-white">
                                CodeArmor <span className="text-cyan-400">AI</span>
                            </span>
                        </Link>

                        <Link
                            href="/"
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Scanner
                        </Link>
                    </div>

                    <AuthStatus />
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-32 pb-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400">
                                <Clock className="w-6 h-6" />
                            </div>
                            <h1 className="text-4xl font-bold text-white">Your Security History</h1>
                        </div>
                        <p className="text-slate-400 text-lg">
                            Read-only audit trail of your scans, PRs, and regressions detected
                        </p>
                    </div>

                    <div className="space-y-8">
                        {/* Scan History */}
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <FileCode className="w-5 h-5 text-cyan-400" />
                                Recent Scans ({scanHistory.length})
                            </h2>
                            {scanHistory.length === 0 ? (
                                <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-[#0B0C15]/50">
                                    <p className="text-slate-500">No scans yet. Start analyzing code to build your history.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {scanHistory.map((scan) => (
                                        <div
                                            key={scan.id}
                                            className="bg-[#0B0C15] border border-white/5 rounded-xl p-5 hover:border-cyan-500/30 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="px-2 py-0.5 bg-white/5 rounded text-xs font-mono text-slate-400">
                                                            {scan.scan_type}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-0.5 rounded text-xs font-bold ${scan.risk_level === "LOW"
                                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                                    : scan.risk_level === "MEDIUM"
                                                                        ? "bg-amber-500/10 text-amber-400"
                                                                        : "bg-rose-500/10 text-rose-400"
                                                                }`}
                                                        >
                                                            {scan.risk_level}
                                                        </span>
                                                        {scan.repo && (
                                                            <span className="text-xs text-slate-500">
                                                                {scan.owner}/{scan.repo}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-400 font-mono truncate">{scan.target}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                        <span>Score: {scan.security_score}</span>
                                                        <span>•</span>
                                                        <span>{scan.findings_count} findings</span>
                                                        <span>•</span>
                                                        <span>{scan.definite_count} definite</span>
                                                        {scan.regressions_count > 0 && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-rose-400">{scan.regressions_count} regressions</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-white">{scan.security_score}</div>
                                                    <div className="text-xs text-slate-500">
                                                        {new Date(scan.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* PR Fixes */}
                        {prFixes.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <GitPullRequest className="w-5 h-5 text-emerald-400" />
                                    PR Fixes Created ({prFixes.length})
                                </h2>
                                <div className="space-y-3">
                                    {prFixes.map((pr) => (
                                        <div
                                            key={pr.id}
                                            className="bg-[#0B0C15] border border-white/5 rounded-xl p-5 hover:border-emerald-500/30 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span
                                                            className={`px-2 py-0.5 rounded text-xs font-bold ${pr.status === "merged"
                                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                                    : pr.status === "open"
                                                                        ? "bg-blue-500/10 text-blue-400"
                                                                        : "bg-slate-500/10 text-slate-400"
                                                                }`}
                                                        >
                                                            {pr.status}
                                                        </span>
                                                        <span className="text-sm text-slate-300">
                                                            {pr.owner}/{pr.repo} #{pr.pr_number}
                                                        </span>
                                                    </div>
                                                    <a
                                                        href={pr.pr_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                                                    >
                                                        View PR →
                                                    </a>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                        <span>{pr.fixes_applied} fixes applied</span>
                                                        <span>•</span>
                                                        <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Regressions */}
                        {regressions.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                                    Regressions Detected ({regressions.length})
                                </h2>
                                <div className="space-y-3">
                                    {regressions.map((reg) => (
                                        <div
                                            key={reg.id}
                                            className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-5"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="px-2 py-0.5 bg-rose-500/20 rounded text-xs font-bold text-rose-400">
                                                            {reg.severity}
                                                        </span>
                                                        <span className="text-sm text-slate-300">
                                                            {reg.owner}/{reg.repo} PR #{reg.pr_number}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-400">
                                                        Regression of fix from PR #{reg.original_fix_pr}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                        <span>File: {reg.file_affected}</span>
                                                        <span>•</span>
                                                        <span>{new Date(reg.detected_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-800 bg-[#0b0f19]">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                            Built by <span className="font-bold text-gray-300">Adnan Basil</span>
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
