export function validateGitHubURL(url: string): { valid: boolean; owner?: string; repo?: string } {
    try {
        const githubPattern = /^https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)\/?$/;
        const match = url.match(githubPattern);

        if (match) {
            return { valid: true, owner: match[1], repo: match[2].replace(/\.git$/, '') };
        }

        return { valid: false };
    } catch {
        return { valid: false };
    }
}

export function validateOwnerRepo(owner: string, repo: string): boolean {
    const ownerPattern = /^[a-zA-Z0-9_-]+$/;
    const repoPattern = /^[a-zA-Z0-9_.-]+$/; // Allow dots in repo names
    return (
        ownerPattern.test(owner) &&
        repoPattern.test(repo) &&
        owner.length > 0 &&
        owner.length <= 39 &&
        repo.length > 0 &&
        repo.length <= 100
    );
}

export function validatePRNumber(prNumber: number): boolean {
    return Number.isInteger(prNumber) && prNumber > 0 && prNumber < 1000000;
}

export function sanitizeCode(code: string): string {
    if (typeof code !== 'string') return '';

    // Limit code length
    const maxLength = 50000; // 50KB
    if (code.length > maxLength) {
        return code.substring(0, maxLength);
    }

    return code;
}

export function validateEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email) && email.length <= 254;
}

export function sanitizeInput(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') return '';
    return input.substring(0, maxLength).trim();
}
