"use client"

import { useState, useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { updateWorkoutAction } from "./actions"
import { WorkoutWithExercises } from "@/data/workouts"

interface Exercise {
  id?: number
  name: string
  order: number
}

type ActionState = {
  success: boolean
  workout?: WorkoutWithExercises
  message?: string
  redirectTo?: string
  error?: string
  fieldErrors?: {
    name?: string[]
    exercises?: string[]
  }
} | null

interface EditWorkoutFormProps {
  workout: WorkoutWithExercises
}

export function EditWorkoutForm({ workout }: EditWorkoutFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, any>(updateWorkoutAction, null)
  const [workoutName, setWorkoutName] = useState(workout.name)
  const [exercises, setExercises] = useState<Exercise[]>(
    workout.exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      order: ex.order
    }))
  )
  const router = useRouter()

  // Handle redirect on successful workout update
  useEffect(() => {
    if (state?.success && state?.redirectTo) {
      router.push(state.redirectTo)
    }
  }, [state, router])

  const addExercise = () => {
    setExercises(prev => {
      const maxOrder = prev.length > 0 ? Math.max(...prev.map(ex => ex.order)) : 0
      return [...prev, { name: "", order: maxOrder + 1 }]
    })
  }

  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(prev =>
        prev
          .filter((_, i) => i !== index)
          .map((exercise, i) => ({ ...exercise, order: i + 1 }))
      )
    }
  }

  const updateExercise = (index: number, name: string) => {
    setExercises(prev =>
      prev.map((exercise, i) =>
        i === index ? { ...exercise, name } : exercise
      )
    )
  }

  const handleSubmit = async (formData: FormData) => {
    // Prepare exercises data
    const validExercises = exercises
      .filter(exercise => exercise.name && exercise.name.trim() !== "")
      .map((exercise, index) => ({
        id: exercise.id,
        name: exercise.name.trim(),
        order: index + 1
      }))

    const data = {
      id: workout.id,
      name: workoutName,
      exercises: validExercises
    }

    console.log("Updating workout:", { id: workout.id, name: workoutName, exerciseCount: validExercises.length })

    // Call Server Action with typed data
    await formAction(data)
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Workout Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Workout Name</Label>
        <Input
          id="name"
          name="name"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
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
            disabled={isPending || exercises.length >= 20}
          >
            Add Exercise
          </Button>
        </div>

        {exercises.length > 0 ? exercises.map((exercise, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder={`Exercise ${index + 1} (e.g., Bench Press, Squats)`}
                value={exercise.name}
                onChange={(e) => updateExercise(index, e.target.value)}
                disabled={isPending}
              />
            </div>
            {exercises.length > 1 && (
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
          Add at least one exercise to continue.
        </p>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1"
        >
          {isPending ? "Updating..." : "Update Workout"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/dashboard/workout/${workout.id}`)}
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
  )
}