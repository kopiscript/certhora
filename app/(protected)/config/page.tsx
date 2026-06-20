export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentSession } from "@/lib/session"

export default async function ConfigPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Config</h1>
    </main>
  )
}
