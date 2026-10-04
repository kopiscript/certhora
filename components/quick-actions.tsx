"use client"

import Link from "next/link"
import { CalendarDays, Award } from "lucide-react"
import { Button } from "@/components/ui/button"

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/dashboard/events/new" title="Set up a new event and design its certificate">
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          <CalendarDays size={14} />
          Create Event
        </Button>
      </Link>
      <Link href="/dashboard/participants" title="See everyone who has received a certificate, across all events">
        <Button variant="outline" className="gap-2 border-border text-muted-foreground hover:text-foreground hover:bg-secondary">
          <Award size={14} />
          View Certificates
        </Button>
      </Link>
    </div>
  )
}
