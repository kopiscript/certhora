"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const FEATURES = [
  "Instant QR verification on every certificate",
  "Custom certificate templates with drag-and-drop layout",
  "Publicly verifiable certificate links — no login required",
  "Email delivery to participants with one click",
]

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [fieldError, setFieldError] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)

  const [orgName, setOrgName] = useState("")
  const [organizerCd, setOrganizerCd] = useState("")
  const [cdManuallyEdited, setCdManuallyEdited] = useState(false)
  const [socialLink, setSocialLink] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (!cdManuallyEdited) {
      const generated = orgName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4)
      setOrganizerCd(generated)
    }
  }, [orgName, cdManuallyEdited])

  function handleOrganizerCdChange(val: string) {
    setOrganizerCd(val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4))
    setCdManuallyEdited(true)
  }

  function validate() {
    const errors: Record<string, string> = {}
    if (!orgName.trim()) errors.orgName = "Organization name is required"
    if (!organizerCd || organizerCd.length < 2) errors.organizerCd = "Must be 2–4 characters"
    if (!email) errors.email = "Email is required"
    if (password.length < 8) errors.password = "Minimum 8 characters"
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match"
    return errors
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setFieldError({})

    const errors = validate()
    if (Object.keys(errors).length > 0) { setFieldError(errors); return }

    setPending(true)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgName, organizerCd, email, password, socialLink: socialLink || null }),
    })
    const json = await res.json()

    if (!res.ok) {
      json.field ? setFieldError({ [json.field]: json.error }) : setError(json.error ?? "Something went wrong")
      setPending(false)
    } else {
      router.push("/login")
    }
  }

  const inputClass = (field?: string) =>
    `h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary ${
      field && fieldError[field] ? "border-destructive focus-visible:ring-destructive/30" : ""
    }`

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Left branded panel ─────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex w-[460px] shrink-0 flex-col justify-between p-12 relative overflow-hidden border-r border-border"
        style={{ background: "var(--card)" }}
      >
        {/* Dot grid */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        {/* Blue ambient */}
        <div
          aria-hidden
          className="absolute -bottom-48 -left-48 w-[520px] h-[520px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 68%)" }}
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
              Your certificates,<br />professionally delivered.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Join thousands of event organizers who trust Certhora to
              issue and manage their digital credentials.
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

        {/* Free tier callout */}
        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{
              background: "var(--ct-blue-dim)",
              border: "1px solid rgba(37,99,235,0.25)",
              color: "#93C5FD",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            Free to start — 40 certificates/month included
          </div>
        </div>
      </aside>

      {/* ── Right form panel ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px] space-y-7">

            {/* Mobile-only logo */}
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">C</span>
              </div>
              <span className="text-foreground font-semibold">Certhora</span>
            </div>

            {/* Heading */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Account</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Join thousands of event organizers who trust Certhora
              </p>
            </div>

            {/* Global error */}
            {error && (
              <div
                className="px-4 py-3 rounded-lg text-sm"
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

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Organization Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="orgName" className="text-xs uppercase tracking-widest text-muted-foreground">
                    Organization Name
                  </Label>
                  <span className="text-xs text-muted-foreground">{orgName.length}/50</span>
                </div>
                <Input
                  id="orgName"
                  type="text"
                  required
                  maxLength={50}
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="e.g. Certhora Academy"
                  className={inputClass("orgName")}
                />
                {fieldError.orgName && <p className="text-xs text-destructive">{fieldError.orgName}</p>}
              </div>

              {/* Organizer Code */}
              <div className="space-y-1.5">
                <Label htmlFor="organizerCd" className="text-xs uppercase tracking-widest text-muted-foreground">
                  Organizer Code
                </Label>
                <Input
                  id="organizerCd"
                  type="text"
                  required
                  maxLength={4}
                  value={organizerCd}
                  onChange={e => handleOrganizerCdChange(e.target.value)}
                  placeholder="e.g. CTRA"
                  className={`${inputClass("organizerCd")} font-mono tracking-widest`}
                />
                <p className="text-xs text-muted-foreground">
                  Auto-generated · max 4 characters · alphanumeric only
                </p>
                {fieldError.organizerCd && <p className="text-xs text-destructive">{fieldError.organizerCd}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass("email")}
                />
                {fieldError.email && <p className="text-xs text-destructive">{fieldError.email}</p>}
              </div>

              {/* Social Link */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="socialLink" className="text-xs uppercase tracking-widest text-muted-foreground">
                    Social Media Link
                    <span className="ml-1.5 normal-case text-muted-foreground/60 font-normal">(optional)</span>
                  </Label>
                  <span className="text-xs text-muted-foreground">{socialLink.length}/255</span>
                </div>
                <Input
                  id="socialLink"
                  type="url"
                  maxLength={255}
                  value={socialLink}
                  onChange={e => setSocialLink(e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                  className={inputClass()}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className={`${inputClass("password")} pr-11`}
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
                {fieldError.password && <p className="text-xs text-destructive">{fieldError.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-widest text-muted-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className={`${inputClass("confirmPassword")} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldError.confirmPassword && <p className="text-xs text-destructive">{fieldError.confirmPassword}</p>}
              </div>

              <Button
                type="submit"
                disabled={pending}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium mt-1"
              >
                {pending ? "Creating account…" : "Sign Up"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:text-blue-400 transition-colors font-medium">
                  Login
                </Link>
              </p>
            </form>
          </div>
        </div>

        <footer className="py-5 text-center text-xs" style={{ color: "var(--ct-text-3)" }}>
          © 2025 Certhora. All rights reserved.
        </footer>
      </div>

    </div>
  )
}
