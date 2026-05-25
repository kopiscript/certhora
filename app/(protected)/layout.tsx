import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AppSidebar } from "@/components/app-sidebar"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
  })

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
