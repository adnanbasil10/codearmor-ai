import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

if (!githubClientId || !githubClientSecret) {
  // Fail fast on the server if GitHub credentials are missing.
  // This avoids accidentally running without proper OAuth configuration.
  console.warn(
    "[auth] GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is not set. GitHub login will not work until they are configured."
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: githubClientId ?? "",
      clientSecret: githubClientSecret ?? "",
      authorization: {
        params: {
          scope: "read:user public_repo"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account && account.access_token) {
        (token as any).accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session && token && (token as any).accessToken) {
        (session as any).accessToken = (token as any).accessToken;
      }
      return session;
    }
  }
};

