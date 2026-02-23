"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Mock workout data for demonstration
const mockWorkouts = [
  {
    id: 1,
    name: "Upper Body Strength",
    exercises: ["Bench Press", "Pull-ups", "Overhead Press"],
    duration: 45,
    type: "Strength",
    completedAt: new Date(),
  },
  {
    id: 2,
    name: "Cardio Session",
    exercises: ["Treadmill", "Rowing"],
    duration: 30,
    type: "Cardio",
    completedAt: new Date(),
  },
  {
    id: 3,
    name: "Leg Day",
    exercises: ["Squats", "Deadlifts", "Leg Press"],
    duration: 60,
    type: "Strength",
    completedAt: new Date(),
  },
]

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const formatSelectedDate = (date: Date): string => {
    return format(date, "do MMM yyyy")
  }

  const formatDateForInput = (date: Date): string => {
    return format(date, "yyyy-MM-dd")
  }

  const handleDateChange = (dateString: string) => {
    if (dateString) {
      const newDate = parseISO(dateString + "T00:00:00")
      setSelectedDate(newDate)
    }
  }

  const getWorkoutsForDate = (date: Date) => {
    // In a real app, this would filter workouts based on the selected date
    // For now, we'll just return mock data for any selected date
    return mockWorkouts
  }

  const workoutsForDate = getWorkoutsForDate(selectedDate)

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Workout Dashboard</h1>
        <p className="text-muted-foreground">
          Track your fitness progress and view your workout history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date Picker Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
              <CardDescription>
                Choose a date to view workouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="workout-date" className="text-sm font-medium">
                  Workout Date
                </label>
                <Input
                  id="workout-date"
                  type="date"
                  value={formatDateForInput(selectedDate)}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Selected Date</p>
                <p className="text-lg font-semibold">{formatSelectedDate(selectedDate)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workouts List Section */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold mb-2">
              Workouts for {formatSelectedDate(selectedDate)}
            </h2>
            <p className="text-muted-foreground">
              {workoutsForDate.length} workout{workoutsForDate.length !== 1 ? "s" : ""} logged
            </p>
          </div>

          {workoutsForDate.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No workouts logged for this date
                </p>
                <Button>Add Workout</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {workoutsForDate.map((workout) => (
                <Card key={workout.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{workout.name}</CardTitle>
                        <CardDescription>
                          {workout.duration} minutes • {workout.exercises.length} exercises
                        </CardDescription>
                      </div>
                      <Badge
                        variant={workout.type === "Strength" ? "default" : "secondary"}
                      >
                        {workout.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2">Exercises:</h4>
                      <div className="flex flex-wrap gap-2">
                        {workout.exercises.map((exercise, index) => (
                          <Badge key={index} variant="outline">
                            {exercise}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}