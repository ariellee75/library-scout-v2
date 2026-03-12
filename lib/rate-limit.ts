/**
 * Simple in-memory rate limiter for serverless environments
 * Uses a sliding window approach
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (resets on cold starts, which is acceptable for basic protection)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number
  /** Window size in seconds */
  windowSizeSeconds: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Check and update rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSizeSeconds * 1000
  const key = identifier

  const existing = rateLimitStore.get(key)

  // If no existing entry or window expired, create new entry
  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: now + windowMs,
    }
  }

  // Check if limit exceeded
  if (existing.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.resetAt,
    }
  }

  // Increment count
  existing.count++
  return {
    success: true,
    remaining: config.maxRequests - existing.count,
    resetAt: existing.resetAt,
  }
}

/**
 * Get client identifier from request (IP or forwarded IP)
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  // Fallback to a generic identifier
  return "unknown-client"
}

/**
 * Standard rate limit configurations
 */
export const RATE_LIMITS = {
  // General API endpoints: 100 requests per minute
  general: { maxRequests: 100, windowSizeSeconds: 60 },
  // Analytics/tracking: 60 requests per minute (1 per second)
  analytics: { maxRequests: 60, windowSizeSeconds: 60 },
  // Auth endpoints: 10 requests per minute (stricter)
  auth: { maxRequests: 10, windowSizeSeconds: 60 },
  // Feedback/forms: 5 requests per minute (strictest)
  feedback: { maxRequests: 5, windowSizeSeconds: 60 },
  // Read-only stats: 30 requests per minute
  stats: { maxRequests: 30, windowSizeSeconds: 60 },
} as const
