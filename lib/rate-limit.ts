import "server-only"

// Best-effort in-process rate limiter — a fixed window per key. This does not
// coordinate across multiple server instances/regions, but it still meaningfully
// raises the cost of credential stuffing / billcode brute-forcing / spam on a
// single-instance deployment, and degrades harmlessly (no-ops per instance) otherwise.
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (bucket.count >= limit) return false
  bucket.count++
  return true
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}
