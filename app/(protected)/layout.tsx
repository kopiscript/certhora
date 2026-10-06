import { redirect } from "next/navigation"
import { getCurrentSession, getCurrentOrganizer } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard-shell"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession()
  if (!session) redirect("/login")

  const organizer = await getCurrentOrganizer(session.user.id)

  return (
    <DashboardShell
      orgName={organizer?.orgName ?? session.user.email ?? ""}
      email={session.user.email ?? ""}
      tier={organizer?.tier ?? "FREE"}
    >
      {children}
    </DashboardShell>
  )
}
