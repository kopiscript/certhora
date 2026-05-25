import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, LayoutTemplate, Calendar, Pencil } from "lucide-react"
import { DeleteTemplateButton } from "./DeleteTemplateButton"

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true },
  })
  if (!organizer) redirect("/login")

  const templates = await prisma.template.findMany({
    where: { organizerCd: organizer.organizerCd },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { events: true } } },
  })

  return (
    <div className="flex flex-col flex-1">
      <header className="h-16 flex items-center justify-between px-8 border-b shrink-0"
        style={{ borderColor: "var(--ct-border)" }}>
        <div>
          <h1 className="text-sm font-semibold">Templates</h1>
          <p className="text-xs" style={{ color: "var(--ct-text-3)" }}>
            Reusable certificate designs
          </p>
        </div>
        <Link href="/dashboard/templates/new">
          <button style={{
            display: "flex", alignItems: "center", gap: 7,
            height: 36, padding: "0 14px", background: "var(--ct-blue)",
            color: "white", border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>
            <Plus size={14} />
            New Template
          </button>
        </Link>
      </header>

      <div className="flex-1 p-8">
        {templates.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: 300, gap: 12,
          }}>
            <LayoutTemplate size={32} style={{ color: "var(--ct-text-3)" }} />
            <p style={{ color: "var(--ct-text-2)", fontSize: 14 }}>No templates yet</p>
            <Link href="/dashboard/templates/new">
              <button style={{
                padding: "8px 16px", background: "var(--ct-blue)", color: "white",
                border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer",
              }}>
                Create your first template
              </button>
            </Link>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {templates.map(tpl => (
              <div key={tpl.id} style={{
                background: "var(--ct-surface)", border: "1px solid var(--ct-border)",
                borderRadius: 12, overflow: "hidden",
              }}>
                {/* Preview strip */}
                <div style={{
                  height: 120,
                  background: tpl.imageUrl
                    ? `url(${tpl.imageUrl}) center/cover`
                    : `linear-gradient(135deg, #0c0c1d, ${tpl.primaryColor}33)`,
                  borderBottom: "1px solid var(--ct-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 28,
                    background: tpl.primaryColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                      CERTIFICATE
                    </span>
                  </div>
                  {!tpl.imageUrl && (
                    <span style={{
                      fontSize: 15, fontWeight: 700,
                      color: tpl.nameColor, fontFamily: tpl.nameFont,
                      marginTop: 20, padding: "0 12px", textAlign: "center",
                    }}>
                      Participant Name
                    </span>
                  )}
                </div>

                <div style={{ padding: 14 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ct-text)", marginBottom: 4 }}>
                    {tpl.name}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--ct-text-3)", marginBottom: 12 }}>
                    <Calendar size={10} style={{ display: "inline", marginRight: 4 }} />
                    Used in {tpl._count.events} event{tpl._count.events !== 1 ? "s" : ""}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/dashboard/templates/${tpl.id}/edit`} style={{ flex: 1 }}>
                      <button style={{
                        width: "100%", height: 32, background: "var(--ct-surface-2)",
                        border: "1px solid var(--ct-border)", borderRadius: 7,
                        fontSize: 12, color: "var(--ct-text-2)", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      }}>
                        <Pencil size={12} /> Edit
                      </button>
                    </Link>
                    <DeleteTemplateButton templateId={tpl.id} usedInEvents={tpl._count.events} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
