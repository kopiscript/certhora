import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const orgName: string | undefined = body.orgName?.trim()
  const socialLink: string | null = body.socialLink?.trim() || null

  if (!orgName) return NextResponse.json({ error: 'Organization name is required.' }, { status: 400 })
  if (orgName.length > 120) return NextResponse.json({ error: 'Name too long.' }, { status: 400 })

  const organizer = await prisma.organizer.findUnique({
    where: { userId: session.user.id },
    select: { organizerCd: true },
  })
  if (!organizer) return NextResponse.json({ error: 'Organizer not found.' }, { status: 404 })

  await prisma.organizer.update({
    where: { organizerCd: organizer.organizerCd },
    data: { orgName, socialLink },
  })

  return NextResponse.json({ ok: true })
}
