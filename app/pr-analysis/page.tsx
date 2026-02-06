import { PRAnalyzer } from "@/components/PRAnalyzer";
import { AuthStatus } from "@/components/AuthStatus";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PRAnalysisPage() {
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
                <div className="max-w-7xl mx-auto">
                    <PRAnalyzer />
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
