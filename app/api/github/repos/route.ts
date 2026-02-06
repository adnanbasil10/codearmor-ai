import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !(session as any).accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
            headers: {
                Authorization: `token ${(session as any).accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
            signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (!res.ok) {
            throw new Error("Failed to fetch repositories from GitHub");
        }

        const repos = await res.json();

        const formattedRepos = repos.map((repo: any) => ({
            name: repo.name,
            fullName: repo.full_name,
            owner: repo.owner.login,
            private: repo.private,
            url: repo.html_url,
        }));

        return NextResponse.json(formattedRepos);
    } catch (error: any) {
        console.error("[github/repos] Error:", error.message);
        return NextResponse.json({ error: "Couldn't fetch repositories. Please try again." }, { status: 500 });
    }
}
