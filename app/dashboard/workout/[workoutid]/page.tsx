import { notFound, redirect } from "next/navigation"
import { getUserWorkoutById } from "@/data/workouts"
import { EditWorkoutForm } from "./edit-workout-form"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface EditWorkoutPageProps {
  params: Promise<{ workoutid: string }>
}

export default async function EditWorkoutPage({ params }: EditWorkoutPageProps) {
  const { workoutid } = await params

  // Parse workout ID
  const workoutId = parseInt(workoutid, 10)
  if (isNaN(workoutId)) {
    notFound()
  }

  try {
    // Fetch workout data using Server Component
    const workout = await getUserWorkoutById(workoutId)

    if (!workout) {
      notFound()
    }

    const formattedDate = format(workout.startedAt, "do MMM yyyy")

    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Edit Workout</CardTitle>
            <p className="text-muted-foreground">
              Workout from {formattedDate}
            </p>
          </CardHeader>
          <CardContent>
            <EditWorkoutForm workout={workout} />
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    // Handle unauthorized access
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/login")
    }
    throw error
  }
}