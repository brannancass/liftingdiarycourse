"use client"

import { useState, useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createWorkoutAction } from "./actions"

interface Exercise {
  name: string
  order: number
}

type ActionState = {
  success: boolean
  workout?: any
  message?: string
  redirectTo?: string
  error?: string
  fieldErrors?: {
    name?: string[]
    exercises?: string[]
  }
} | null

export default function NewWorkoutPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createWorkoutAction, null)
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: "", order: 1 }
  ])
  const router = useRouter()

  // Handle redirect on successful workout creation
  useEffect(() => {
    if (state?.success && state?.redirectTo) {
      router.push(state.redirectTo)
    }
  }, [state, router])

  const addExercise = () => {
    setExercises(prev => {
      const prevArray = prev || []
      return [...prevArray, { name: "", order: prevArray.length + 1 }]
    })
  }

  const removeExercise = (index: number) => {
    if (exercises && exercises.length > 1) {
      setExercises(prev => {
        const prevArray = prev || []
        return prevArray
          .filter((_, i) => i !== index)
          .map((exercise, i) => ({ ...exercise, order: i + 1 }))
      })
    }
  }

  const updateExercise = (index: number, name: string) => {
    setExercises(prev => {
      const prevArray = prev || []
      return prevArray.map((exercise, i) =>
        i === index ? { ...exercise, name } : exercise
      )
    })
  }

  const handleSubmit = async (formData: FormData) => {
    // Prepare exercises data
    const exercisesArray = exercises || []
    const validExercises = exercisesArray
      .filter(exercise => exercise && exercise.name && exercise.name.trim() !== "")
      .map((exercise, index) => ({
        name: exercise.name.trim(),
        order: index + 1
      }))

    // Add additional data to FormData
    formData.set("startedAt", new Date().toISOString())
    formData.set("exercises", JSON.stringify(validExercises))

    const data = {
      name: formData.get("name"),
      startedAt: formData.get("startedAt"),
      exercises: validExercises
    }

    console.log("Creating workout:", { name: data.name, exerciseCount: validExercises.length })

    // Call Server Action with FormData
    await formAction(formData)
  }

  const currentDate = format(new Date(), "do MMM yyyy")

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Workout</CardTitle>
          <p className="text-muted-foreground">
            Start a new workout for {currentDate}
          </p>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            {/* Workout Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Workout Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Push Day, Leg Day, Full Body"
                required
                disabled={isPending}
              />
              {state?.fieldErrors?.name && (
                <p className="text-red-500 text-sm">{state.fieldErrors.name[0]}</p>
              )}
            </div>

            <Separator />

            {/* Exercises Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Exercises</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExercise}
                  disabled={isPending || (exercises && exercises.length >= 20)}
                >
                  Add Exercise
                </Button>
              </div>

              {exercises && exercises.length > 0 ? exercises.map((exercise, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={`Exercise ${index + 1} (e.g., Bench Press, Squats)`}
                      value={exercise?.name || ""}
                      onChange={(e) => updateExercise(index, e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                  {exercises && exercises.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeExercise(index)}
                      disabled={isPending}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              )) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No exercises added yet.</p>
                </div>
              )}

              {state?.fieldErrors?.exercises && (
                <p className="text-red-500 text-sm">{state.fieldErrors.exercises[0]}</p>
              )}

              <p className="text-sm text-muted-foreground">
                Add at least one exercise to continue. You can add sets and reps after creating the workout.
              </p>
            </div>

            <Separator />

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1"
              >
                {isPending ? "Creating..." : "Create Workout"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>

            {/* Success Display */}
            {state?.success && (
              <div className="rounded-md bg-green-50 p-4 border border-green-200">
                <p className="text-green-600 text-sm">
                  {state.message} Redirecting...
                </p>
              </div>
            )}

            {/* Error Display */}
            {state?.error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <p className="text-red-600 text-sm">{state.error}</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}