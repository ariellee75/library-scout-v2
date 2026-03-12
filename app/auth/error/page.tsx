import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const errorMessage = error || "Something went wrong during authentication."
  
  // Check if it's an email confirmation issue
  const isConfirmationError = errorMessage.toLowerCase().includes("confirm") || 
    errorMessage.toLowerCase().includes("token") ||
    errorMessage.toLowerCase().includes("expired")

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border bg-card text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold font-serif text-foreground">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConfirmationError && (
            <p className="text-sm text-muted-foreground">
              Your confirmation link may have expired. Try signing in again to receive a new confirmation email.
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Link href="/auth/login">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <RefreshCw className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Go to Homepage
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
