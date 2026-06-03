"use client"

import dynamic from "next/dynamic"
import type { ReactNode } from "react"

const SessionProvider = dynamic(
  () => import("next-auth/react").then(m => ({ default: m.SessionProvider })),
  { ssr: false }
)

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
