import { NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(request: Request) {
  // Strict rate limiting for feedback submissions
  const clientId = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`feedback:${clientId}`, RATE_LIMITS.feedback)
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many feedback submissions. Please wait a moment." },
      { 
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        }
      }
    )
  }

try {
    const body = await request.json()
    const { className, rating, comment, userEmail } = body

    // Input validation
    if (typeof className !== "string" || className.length > 500) {
      return NextResponse.json({ error: "Invalid className" }, { status: 400 })
    }
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating (must be 1-5)" }, { status: 400 })
    }
    if (comment && (typeof comment !== "string" || comment.length > 2000)) {
      return NextResponse.json({ error: "Invalid comment (max 2000 chars)" }, { status: 400 })
    }
    if (userEmail && (typeof userEmail !== "string" || userEmail.length > 320)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    // Sanitize inputs (basic XSS prevention for email content)
    const sanitize = (str: string) => str.replace(/[<>]/g, "")
    const safeClassName = sanitize(className)
    const safeComment = comment ? sanitize(comment) : "No comment"
    const safeEmail = userEmail ? sanitize(userEmail) : "Anonymous"

    const emailBody = [
      `New Feedback for Library Scout`,
      ``,
      `Class: ${safeClassName}`,
      `Rating: ${rating}/5`,
      `Comment: ${safeComment}`,
      `User: ${safeEmail}`,
      `Time: ${new Date().toISOString()}`,
    ].join("\n")

    // Send via Resend if API key is available

    // Attempt to send via Resend if RESEND_API_KEY is available
    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Library Scout <onboarding@resend.dev>",
          to: "ariellee75@gmail.com",
          subject: `Feedback: ${safeClassName.substring(0, 50)} (${rating}/5)`,
          text: emailBody,
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to process feedback:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
