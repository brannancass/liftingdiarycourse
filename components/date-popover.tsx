"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePopoverProps {
  selectedDate: Date
}

export function DatePopover({ selectedDate }: DatePopoverProps) {
  const [open, setOpen] = useState(false)
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
      // Auto-close popover when date is selected
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatSelectedDate(selectedDate)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
        />
      </PopoverContent>
    </Popover>
  )
}
