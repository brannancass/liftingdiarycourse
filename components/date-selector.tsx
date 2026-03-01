"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DateSelectorProps {
  selectedDate: Date
}

export function DateSelector({ selectedDate }: DateSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const formatSelectedDate = (date: Date): string => {
    return format(date, "do MMM yyyy")
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('date', format(date, 'yyyy-MM-dd'))
      router.push(`/dashboard?${params.toString()}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Date</CardTitle>
        <CardDescription>
          Choose a date to view workouts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="w-fit"
          />
        </div>
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Selected Date</p>
          <p className="text-lg font-semibold">{formatSelectedDate(selectedDate)}</p>
        </div>
      </CardContent>
    </Card>
  )
}