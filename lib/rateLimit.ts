const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMITS = {
    snippet: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
    repo: { maxRequests: 5, windowMs: 60000 }, // 5 per minute
    pr: { maxRequests: 5, windowMs: 60000 }, // 5 per minute
    fix: { maxRequests: 3, windowMs: 300000 }, // 3 per 5 minutes
};

export function rateLimit(
    identifier: string,
    type: keyof typeof RATE_LIMITS = 'snippet'
): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const limit = RATE_LIMITS[type];
    const key = `${type}:${identifier}`;

    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
        const resetTime = now + limit.windowMs;
        rateLimitMap.set(key, { count: 1, resetTime });
        return { allowed: true, remaining: limit.maxRequests - 1, resetTime };
    }

    if (record.count >= limit.maxRequests) {
        return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    record.count++;
    return {
        allowed: true,
        remaining: limit.maxRequests - record.count,
        resetTime: record.resetTime,
    };
}

// Cleanup old entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    rateLimitMap.forEach((record, key) => {
        if (now > record.resetTime) {
            keysToDelete.push(key);
        }
    });

    keysToDelete.forEach(key => rateLimitMap.delete(key));
}, 600000);
