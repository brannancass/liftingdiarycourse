import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getUserWorkoutsForDate } from "@/data/workouts"
import { redirect } from "next/navigation"
import { DateSelector } from "@/components/date-selector"

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Await the searchParams promise
  const resolvedSearchParams = await searchParams

  // Get date from search params or default to today
  const dateParam = resolvedSearchParams.date
  const selectedDate = dateParam && typeof dateParam === 'string'
    ? parseISO(dateParam + 'T00:00:00')
    : new Date()

  const formatSelectedDate = (date: Date): string => {
    return format(date, "do MMM yyyy")
  }

  let workoutsForDate
  try {
    workoutsForDate = await getUserWorkoutsForDate(selectedDate)
  } catch (error) {
    // Handle unauthorized access
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/sign-in")
    }
    throw error
  }

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
          <DateSelector selectedDate={selectedDate} />
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
                          {workout.duration ? `${workout.duration} minutes • ` : ""}
                          {workout.exercises.length} exercise{workout.exercises.length !== 1 ? "s" : ""}
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
                        {workout.exercises.map((exercise) => (
                          <Badge key={exercise.id} variant="outline">
                            {exercise.name}
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