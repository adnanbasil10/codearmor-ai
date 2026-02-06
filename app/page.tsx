"use client";

import { Analyzer } from "@/components/Analyzer";
import { AuthStatus } from "@/components/AuthStatus";
import { ShieldCheck, Github, Twitter, Linkedin, CheckCircle, BarChart3, Lock, Search, GitPullRequest } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

export default function Page() {
  const { data: session } = useSession();

  const scrollToAnalyzer = () => {
    document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">

      {/* 1. HEADER */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0b0f19]/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="bg-cyan-500/20 p-1.5 rounded-lg text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">CodeArmor <span className="text-cyan-400">AI</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <button onClick={scrollToAnalyzer} className="hover:text-white transition-colors">Features</button>
            <Link href="/pr-analysis" className="hover:text-white transition-colors flex items-center gap-1.5">
              <GitPullRequest className="w-3.5 h-3.5" />
              PR Analysis
            </Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          </div>

          <div>
            <AuthStatus />
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Stop shipping security debt <br className="hidden md:block" /> with your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI code</span>.
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            CodeArmor scans your AI-generated codebases for OWASP vulnerabilities and auto-fixes them before deployment. Trust your copilot again.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={scrollToAnalyzer}
              className="px-8 py-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 transform hover:-translate-y-1 hover:scale-105"
            >
              Start Scanning Free
            </button>
            {session?.user ? (
              <div className="px-8 py-4 rounded-full bg-gray-800 text-white font-bold text-sm border border-gray-700 flex items-center gap-3">
                {session.user.image && (
                  <img src={session.user.image} alt="Avatar" className="w-6 h-6 rounded-full" />
                )}
                <span className="text-cyan-400">@{session.user.name || session.user.email?.split('@')[0]}</span>
              </div>
            ) : (
              <button
                onClick={() => signIn("github")}
                className="px-8 py-4 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm border border-gray-700 transition-all flex items-center gap-2 hover:border-gray-500"
              >
                <Github className="w-4 h-4" /> Connect GitHub
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. STATS STRIP */}
      <section className="bg-gray-900/50 border-y border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Vulnerabilities Detected", value: "10k+", icon: Search },
            { label: "Repos Secured", value: "500+", icon: Lock },
            { label: "False Positive Rate", value: "< 0.1%", icon: BarChart3 },
            { label: "Fix Success Rate", value: "99%", icon: CheckCircle },
          ].map((stat, i) => (
            <div key={i} className="space-y-2 group hover:bg-white/5 p-4 rounded-xl transition-colors">
              <div className="flex justify-center mb-2 text-cyan-500/50 group-hover:text-cyan-400 transition-colors">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SCANNER PANEL */}
      <section id="analyzer" className="py-24 px-6 relative scroll-mt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-900/5 to-transparent pointer-events-none -z-10" />
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">AI-Powered Security Engine</h2>
            <p className="text-gray-400">Run a deep scan on your snippets or repositories instantly.</p>
          </div>

          {/* The Analyzer Component handles the card layout, tabs, and logic */}
          <div className="bg-[#111827] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden ring-1 ring-white/5">
            <div className="p-1">
              <Analyzer />
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="py-12 border-t border-gray-800 bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-400">CodeArmor AI</span>
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>Built by</span>
            <span className="font-bold text-gray-300">Adnan Basil</span>
          </div>

          <div className="flex gap-6">
            <a href="https://github.com/adnanbasil10" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
            <a href="https://www.linkedin.com/in/adnanbasil" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
            <a href="https://x.com/BasilAdnan" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
