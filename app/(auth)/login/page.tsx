"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const FEATURES = [
  "Instant QR verification on every certificate",
  "Custom certificate templates with drag-and-drop layout",
  "Publicly verifiable certificate links — no login required",
  "Email delivery to participants with one click",
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password.")
      setPending(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Left branded panel ─────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex w-[460px] shrink-0 flex-col justify-between p-12 relative overflow-hidden border-r border-border"
        style={{ background: "var(--card)" }}
      >
        {/* Dot grid texture */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        {/* Blue ambient glow */}
        <div
          aria-hidden
          className="absolute -top-48 -right-48 w-[520px] h-[520px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.11) 0%, transparent 68%)" }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <Image src="/certhoralogo.svg" alt="" width={32} height={32} className="h-8 w-8 shrink-0" />
          <span className="text-foreground font-semibold tracking-tight">Certhora</span>
        </div>

        {/* Copy + features */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-[26px] font-bold leading-snug tracking-tight text-foreground">
              Professional certificates,<br />built for scale.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              From single events to enterprise deployments — manage,
              distribute, and verify digital credentials in one place.
            </p>
          </div>

          <ul className="space-y-3.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <div
                  className="mt-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "var(--ct-blue-dim)" }}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust line */}
        <p className="relative z-10 text-xs" style={{ color: "var(--ct-text-3)" }}>
          Trusted by event organizers across Malaysia
        </p>
      </aside>

      {/* ── Right form panel ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">

        {/* Indeterminate loading bar */}
        <div className="h-0.5 w-full overflow-hidden" style={{ background: "var(--ct-border)" }}>
          {pending && (
            <div
              className="h-full rounded-full"
              style={{
                background: "var(--ct-blue)",
                animation: "indeterminate 1.4s ease-in-out infinite",
                transformOrigin: "left center",
              }}
            />
          )}
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[360px] space-y-8">

            {/* Mobile-only logo */}
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">C</span>
              </div>
              <span className="text-foreground font-semibold">Certhora</span>
            </div>

            {/* Heading */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sign in to your Certhora account
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div
                className="px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-1 duration-200"
                style={{
                  background: "var(--ct-error-bg)",
                  border: "1px solid var(--ct-error-border)",
                  color: "var(--ct-error)",
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className={`space-y-5 transition-opacity duration-200 ${pending ? "opacity-60 pointer-events-none" : "opacity-100"}`}
              noValidate
            >
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">
                    Password
                  </Label>
                  <span className="text-xs text-primary hover:text-blue-400 cursor-pointer transition-colors">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={pending}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2 transition-all"
              >
                {pending && <Loader2 size={15} className="animate-spin" />}
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:text-blue-400 transition-colors font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>

        <footer className="py-5 text-center text-xs" style={{ color: "var(--ct-text-3)" }}>
          © 2025 Certhora. All rights reserved.
        </footer>
      </div>

    </div>
  )
}
