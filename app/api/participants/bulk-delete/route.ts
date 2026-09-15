import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromR2 } from '@/lib/r2'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true },
  })
  if (!organizer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { certIds: string[] }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { certIds } = body
  if (!Array.isArray(certIds) || certIds.length === 0) {
    return NextResponse.json({ error: 'certIds array is required' }, { status: 400 })
  }

  const owned = await prisma.certificate.findMany({
    where: { certId: { in: certIds }, event: { organizerCd: organizer.organizerCd } },
    select: { certId: true },
  })

  // Sequential deletes — PrismaNeonHttp doesn't support deleteMany/transactions
  // reliably in this codebase's experience, so each row is removed individually.
  let deleted = 0
  for (const { certId } of owned) {
    await deleteFromR2(`certificates/${certId}.png`)
    await prisma.certificate.delete({ where: { certId } })
    deleted++
  }

  return NextResponse.json({ deleted })
}
