import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserScanHistory, getUserPRFixes, getUserRegressions } from "@/lib/supabase";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.email;

        const [scanHistory, prFixes, regressions] = await Promise.all([
            getUserScanHistory(userId),
            getUserPRFixes(userId),
            getUserRegressions(userId),
        ]);

        return NextResponse.json({
            scanHistory,
            prFixes,
            regressions,
        });
    } catch (error: any) {
        console.error("[History API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch history" },
            { status: 500 }
        );
    }
}
