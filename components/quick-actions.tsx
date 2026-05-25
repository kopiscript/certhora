"use client"

import { CalendarDays, Award } from "lucide-react"
import { Button } from "@/components/ui/button"

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
        <CalendarDays size={14} />
        Create Event
      </Button>
      <Button variant="outline" className="gap-2 border-border text-muted-foreground hover:text-foreground hover:bg-secondary">
        <Award size={14} />
        View Certificates
      </Button>
    </div>
  )
}
