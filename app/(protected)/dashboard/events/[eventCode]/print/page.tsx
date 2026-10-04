export const dynamic = "force-dynamic"

import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentSession, getCurrentOrganizer } from "@/lib/session"
import { PrintSheet } from "./PrintSheet"

const BATCH = 50

interface Props {
  params: Promise<{ eventCode: string }>
  searchParams: Promise<{ ids?: string; from?: string }>
}

export default async function PrintCertificatesPage({ params, searchParams }: Props) {
  const session = await getCurrentSession()
  if (!session) redirect("/login")

  const organizer = await getCurrentOrganizer(session.user.id)
  if (!organizer) redirect("/login")

  const { eventCode } = await params
  const { ids, from } = await searchParams

  const event = await prisma.event.findUnique({
    where: { eventCode },
    select: { eventName: true, organizerCd: true },
  })
  if (!event || event.organizerCd !== organizer.organizerCd) notFound()

  const requestedIds = ids ? Array.from(new Set(ids.split(",").filter(Boolean))) : null

  const certs = await prisma.certificate.findMany({
    where: {
      eventCode,
      ...(requestedIds ? { certId: { in: requestedIds } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { certId: true, emailStatus: true, imageUrl: true },
  })

  const printable = certs.filter((c) => c.emailStatus !== "PENDING")
  const skipped = certs.length - printable.length

  const parsedFrom = Number.parseInt(from ?? "0", 10)
  const start = Number.isFinite(parsedFrom) && parsedFrom > 0 ? parsedFrom : 0
  const batch = printable.slice(start, start + BATCH)
  const end = start + batch.length

  const query = new URLSearchParams()
  if (requestedIds) query.set("ids", requestedIds.join(","))
  query.set("from", String(end))
  const nextHref = end < printable.length ? `/dashboard/events/${eventCode}/print?${query.toString()}` : null

  const pdfQuery = new URLSearchParams()
  if (requestedIds) pdfQuery.set("ids", requestedIds.join(","))
  pdfQuery.set("from", String(start))
  const pdfHref = `/api/events/${eventCode}/certificates-pdf?${pdfQuery.toString()}`

  return (
    <PrintSheet
      eventCode={eventCode}
      eventName={event.eventName}
      certs={batch.map((c) => ({ certId: c.certId, src: c.imageUrl ?? `/api/certs/${c.certId}/preview` }))}
      rangeStart={batch.length > 0 ? start + 1 : 0}
      rangeEnd={end}
      total={printable.length}
      skipped={skipped}
      nextHref={nextHref}
      pdfHref={pdfHref}
    />
  )
}
