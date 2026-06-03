export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ConfigPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Config</h1>
    </main>
  )
}
