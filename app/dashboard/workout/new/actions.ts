"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/data/auth"
import { createWorkout } from "@/data/workouts"

// Zod schemas for validation
const CreateWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(100, "Workout name must be less than 100 characters"),
  startedAt: z.string().refine((val) => {
    const date = new Date(val)
    return !isNaN(date.getTime())
  }, "Invalid date format"),
  exercises: z.array(z.object({
    name: z.string().min(1, "Exercise name is required").max(100, "Exercise name must be less than 100 characters"),
    order: z.number().int().min(1, "Exercise order must be at least 1")
  })).min(1, "At least one exercise is required").max(20, "Maximum 20 exercises per workout")
})

// Server Action with useActionState signature
export async function createWorkoutAction(prevState: any, formData: FormData) {
  // Extract data from FormData and convert exercises from JSON
  const name = formData.get("name") as string
  const startedAt = formData.get("startedAt") as string
  const exercisesJson = formData.get("exercises") as string

  let exercises: Array<{ name: string; order: number }> = []
  try {
    exercises = JSON.parse(exercisesJson)
  } catch (parseError) {
    console.error("Error parsing exercises JSON:", parseError)
    return {
      success: false,
      error: "Invalid exercises data format"
    }
  }

  const data = { name, startedAt, exercises }

  try {

    // Log the input data for debugging (remove in production)
    console.log("Creating workout:", { name: data.name, exerciseCount: data.exercises.length })

    // 1. Validate input
    const validatedData = CreateWorkoutSchema.parse(data)

    // 2. Check authentication
    const userId = await requireAuth()

    // 3. Call helper function
    const result = await createWorkout({
      name: validatedData.name,
      startedAt: new Date(validatedData.startedAt),
      userId,
      exercises: validatedData.exercises
    })

    // 4. Revalidate cache
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/workout")

    // Return success state with redirect URL for client-side navigation
    return {
      success: true,
      workout: result.workout,
      message: "Workout created successfully",
      redirectTo: "/dashboard"
    }

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error("Zod validation error:", error)
      console.error("Zod error issues:", error.issues)
      console.error("Input data:", data)

      // Use the issues array which is the correct property
      const errorMessages = error.issues?.map(issue => {
        const path = issue.path ? issue.path.join('.') : 'unknown'
        return `${path}: ${issue.message}`
      }).join(', ') || "Validation failed"

      const flattened = error.flatten()
      console.error("Flattened errors:", flattened)

      return {
        success: false,
        error: "Invalid input data: " + errorMessages,
        fieldErrors: flattened.fieldErrors
      }
    }

    // Handle other errors
    console.error("Failed to create workout:", error)
    return {
      success: false,
      error: "Failed to create workout. Please try again."
    }
  }
}