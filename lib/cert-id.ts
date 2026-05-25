import { prisma } from "@/lib/prisma"

/**
 * Generates a unique certificate ID in the format:
 *   [OrganizerCode][4-digit number]  e.g. "GDG4819", "CERT2047"
 *
 * Retries up to maxAttempts times on collision.
 */
export async function generateUniqueCertId(
  organizerCd: string,
  maxAttempts = 10
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // 4-digit number: 1000–9999
    const digits = String(Math.floor(1000 + Math.random() * 9000))
    const certId = `${organizerCd.toUpperCase()}${digits}`

    const existing = await prisma.certificate.findUnique({
      where: { certId },
      select: { certId: true },
    })

    if (!existing) return certId
  }

  throw new Error(
    `Could not generate a unique cert ID for organizer "${organizerCd}" after ${maxAttempts} attempts`
  )
}

/**
 * Pre-generates a batch of unique cert IDs in one pass.
 * Fetches all existing IDs for this organizer prefix once to minimise DB round-trips.
 */
export async function generateUniqueCertIdBatch(
  organizerCd: string,
  count: number
): Promise<string[]> {
  const prefix = organizerCd.toUpperCase()

  // Fetch all existing cert IDs with this prefix
  const existing = await prisma.certificate.findMany({
    where: { certId: { startsWith: prefix } },
    select: { certId: true },
  })
  const existingSet = new Set(existing.map(r => r.certId))

  const ids: string[] = []
  let attempts = 0
  const maxAttempts = count * 20

  while (ids.length < count && attempts < maxAttempts) {
    const digits = String(Math.floor(1000 + Math.random() * 9000))
    const certId = `${prefix}${digits}`

    if (!existingSet.has(certId) && !ids.includes(certId)) {
      ids.push(certId)
      existingSet.add(certId) // reserve it locally
    }
    attempts++
  }

  if (ids.length < count) {
    throw new Error(
      `Could not generate ${count} unique cert IDs for organizer "${organizerCd}"`
    )
  }

  return ids
}
