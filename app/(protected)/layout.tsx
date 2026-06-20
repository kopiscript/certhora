import { redirect } from "next/navigation"
import { getCurrentSession, getCurrentOrganizer } from "@/lib/session"
import { AppSidebar } from "@/components/app-sidebar"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession()
  if (!session) redirect("/login")

  const organizer = await getCurrentOrganizer(session.user.id)

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        orgName={organizer?.orgName ?? session.user.email ?? ""}
        email={session.user.email ?? ""}
        tier={organizer?.tier ?? "FREE"}
      />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  )
}
