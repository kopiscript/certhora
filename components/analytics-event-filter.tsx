"use client"

import { useRouter } from "next/navigation"

interface Props {
  events: { eventCode: string; eventName: string }[]
  selected: string
}

export function AnalyticsEventFilter({ events, selected }: Props) {
  const router = useRouter()

  return (
    <label className="flex items-center gap-2 text-xs" style={{ color: "var(--ct-text-2)" }}>
      Show data for
      <select
        value={selected}
        onChange={(e) => {
          const v = e.target.value
          router.push(v ? `/dashboard/analytics?event=${encodeURIComponent(v)}` : "/dashboard/analytics")
        }}
        className="ct-input"
        style={{ width: "auto", minWidth: 200, padding: "6px 10px", fontSize: 13 }}
      >
        <option value="">All events</option>
        {events.map((e) => (
          <option key={e.eventCode} value={e.eventCode}>
            {e.eventName}
          </option>
        ))}
      </select>
    </label>
  )
}
