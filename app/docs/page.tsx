"use client";

import { AuthStatus } from "@/components/AuthStatus";
import { ShieldCheck, ArrowLeft, BookOpen, AlertCircle, CheckCircle2, Info } from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
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
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <h1 className="text-4xl font-bold text-white">Documentation</h1>
                        </div>
                        <p className="text-slate-400 text-lg">
                            Everything you need to know about CodeArmor AI
                        </p>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-12">
                        {/* What CodeArmor Does */}
                        <section className="bg-[#0B0C15] border border-white/5 rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                What CodeArmor Does
                            </h2>
                            <div className="space-y-4 text-slate-300">
                                <p>CodeArmor AI is a security analysis tool that helps developers identify vulnerabilities in their code and GitHub Pull Requests. It provides:</p>
                                <ul className="space-y-2 ml-6 list-disc">
                                    <li><strong>Security Regression Guard</strong> - Detects when a PR reintroduces a previously fixed vulnerability</li>
                                    <li><strong>PR Risk Delta</strong> - Calculates security risk scores for Pull Requests</li>
                                    <li><strong>Assumption-Aware Analysis</strong> - Transparent vulnerability detection with clear certainty levels</li>
                                </ul>
                            </div>
                        </section>

                        {/* What CodeArmor Does NOT Do */}
                        <section className="bg-[#0B0C15] border border-rose-500/20 rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <AlertCircle className="w-6 h-6 text-rose-400" />
                                What CodeArmor Does NOT Do
                            </h2>
                            <div className="space-y-3 text-slate-300">
                                <ul className="space-y-2 ml-6 list-disc">
                                    <li><strong>Does NOT guarantee 100% security</strong> - No automated tool can catch every vulnerability</li>
                                    <li><strong>Does NOT replace manual code review</strong> - Human expertise is still essential</li>
                                    <li><strong>Does NOT execute or modify your code</strong> - Analysis is read-only</li>
                                    <li><strong>Does NOT store your code</strong> - Code is analyzed in real-time and not persisted</li>
                                    <li><strong>Does NOT have access to private repos</strong> - Unless you explicitly grant OAuth permissions</li>
                                </ul>
                            </div>
                        </section>

                        {/* Security Score */}
                        <section className="bg-[#0B0C15] border border-white/5 rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Understanding the Security Score</h2>
                            <p className="text-slate-300 mb-6">
                                The Security Score is a number from <strong>0 to 100</strong> that represents the overall security health of your code:
                            </p>
                            <div className="grid gap-4">
                                <div className="flex items-start gap-4 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                                    <div className="text-3xl">🟢</div>
                                    <div>
                                        <h3 className="font-bold text-emerald-400 mb-1">80-100: Secure</h3>
                                        <p className="text-sm text-slate-400">No major vulnerabilities detected</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl">
                                    <div className="text-3xl">🟡</div>
                                    <div>
                                        <h3 className="font-bold text-amber-400 mb-1">50-79: Needs Attention</h3>
                                        <p className="text-sm text-slate-400">Some potential risks or medium-severity issues</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-rose-950/20 border border-rose-500/20 rounded-xl">
                                    <div className="text-3xl">🔴</div>
                                    <div>
                                        <h3 className="font-bold text-rose-400 mb-1">0-49: Insecure</h3>
                                        <p className="text-sm text-slate-400">Definite vulnerabilities or high-severity risks detected</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Definite vs Potential */}
                        <section className="bg-[#0B0C15] border border-white/5 rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Definite vs Potential</h2>
                            <p className="text-slate-300 mb-6">
                                Every security finding is labeled with a <strong>Certainty</strong> level:
                            </p>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-rose-400 mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5" />
                                        Definite Vulnerability
                                    </h3>
                                    <p className="text-slate-300 mb-3">A finding is marked as "Definite" only when:</p>
                                    <ul className="space-y-2 ml-6 list-disc text-slate-400 text-sm">
                                        <li>User input is <strong>clearly</strong> used unsafely (e.g., direct SQL interpolation, eval())</li>
                                        <li>Authentication is <strong>clearly</strong> missing on sensitive endpoints</li>
                                        <li>Secrets are <strong>clearly</strong> hardcoded in the code</li>
                                    </ul>
                                    <div className="mt-3 p-3 bg-rose-950/20 border border-rose-500/20 rounded-lg">
                                        <p className="text-xs font-mono text-rose-300">
                                            Example: db.query("SELECT * FROM users WHERE id = " + userId)
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-amber-400 mb-2 flex items-center gap-2">
                                        <Info className="w-5 h-5" />
                                        Potential Risk (Context Required)
                                    </h3>
                                    <p className="text-slate-300 mb-3">A finding is marked as "Potential" when:</p>
                                    <ul className="space-y-2 ml-6 list-disc text-slate-400 text-sm">
                                        <li>We must make assumptions about variable origins or data flow</li>
                                        <li>Context about validation elsewhere is missing</li>
                                        <li>There's uncertainty about framework protections</li>
                                    </ul>
                                    <div className="mt-3 p-3 bg-amber-950/20 border border-amber-500/20 rounded-lg">
                                        <p className="text-xs font-mono text-amber-300">
                                            Example: db.query(buildQuery(userId))
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Limitations */}
                        <section className="bg-[#0B0C15] border border-white/5 rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Limitations</h2>
                            <div className="space-y-4 text-slate-300">
                                <div>
                                    <h3 className="font-semibold text-white mb-2">Technical Limitations</h3>
                                    <ul className="space-y-2 ml-6 list-disc text-sm text-slate-400">
                                        <li><strong>AI-based analysis</strong>: Results depend on the AI model's training and may not be perfect</li>
                                        <li><strong>Context limitations</strong>: Cannot analyze code outside the provided snippet or PR</li>
                                        <li><strong>Framework-specific</strong>: May not understand all framework-specific security features</li>
                                        <li><strong>False positives</strong>: Conservative approach may flag safe code as potential risks</li>
                                        <li><strong>False negatives</strong>: May miss vulnerabilities that require deep contextual understanding</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white mb-2">Scope Limitations</h3>
                                    <ul className="space-y-2 ml-6 list-disc text-sm text-slate-400">
                                        <li><strong>No runtime analysis</strong>: Cannot detect vulnerabilities that only appear at runtime</li>
                                        <li><strong>No dependency scanning</strong>: Does not analyze third-party dependencies</li>
                                        <li><strong>No infrastructure scanning</strong>: Does not check server configurations or cloud settings</li>
                                        <li><strong>No compliance checking</strong>: Does not verify regulatory compliance (GDPR, HIPAA, etc.)</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Disclaimer */}
                        <section className="bg-rose-950/10 border border-rose-500/20 rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-rose-400 mb-4">Disclaimer</h2>
                            <p className="text-slate-300 mb-4">
                                CodeArmor AI is provided "as is" without warranty of any kind. While we strive for accuracy, we cannot guarantee that all vulnerabilities will be detected or that all findings are accurate.
                            </p>
                            <p className="text-white font-semibold">
                                You are responsible for the security of your code.
                            </p>
                            <p className="text-slate-400 text-sm mt-4">
                                Use CodeArmor as a helpful assistant, not a replacement for security expertise.
                            </p>
                        </section>
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
