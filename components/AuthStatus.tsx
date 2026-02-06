"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Github, Loader2, LogOut } from "lucide-react";

export function AuthStatus() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <Loader2 className="w-4 h-4 animate-spin text-slate-500" />;
    }

    if (status === "authenticated" && session?.user) {
        return (
            <div className="relative group">
                <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                    {session.user.image ? (
                        <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/20">
                            {session.user.name?.[0] || "U"}
                        </div>
                    )}
                    <div className="hidden sm:flex flex-col items-start">
                        <span className="text-xs font-bold text-slate-200">
                            {session.user.name || "User"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                            {session.user.email}
                        </span>
                    </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-[#0B0C15] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors rounded-xl"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => signIn("github")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#24292F] hover:bg-[#2b3138] text-white text-xs font-bold transition-all border border-white/5"
        >
            <Github className="w-4 h-4" />
            <span>Login with GitHub</span>
        </button>
    );
}
