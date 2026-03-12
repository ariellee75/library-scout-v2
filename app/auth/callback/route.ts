import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/classes"
  const error = searchParams.get("error")
  const error_description = searchParams.get("error_description")

  // Handle OAuth errors
  if (error) {
    console.error("[Auth Callback] Error:", error, error_description)
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error_description || error)}`
    )
  }

  const supabase = await createClient()

  // Handle PKCE code exchange (OAuth / magic link with code)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      console.error("[Auth Callback] Code exchange error:", exchangeError.message)
      return NextResponse.redirect(
        `${origin}/auth/error?error=${encodeURIComponent(exchangeError.message)}`
      )
    }
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Handle email confirmation (token_hash based - older flow)
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "recovery" | "invite" | "email" | "magiclink",
    })
    if (verifyError) {
      console.error("[Auth Callback] OTP verify error:", verifyError.message)
      return NextResponse.redirect(
        `${origin}/auth/error?error=${encodeURIComponent(verifyError.message)}`
      )
    }
    return NextResponse.redirect(`${origin}${next}`)
  }

  // No valid params - redirect to error
  console.error("[Auth Callback] No code or token_hash provided")
  return NextResponse.redirect(
    `${origin}/auth/error?error=${encodeURIComponent("Invalid confirmation link")}`
  )
}
