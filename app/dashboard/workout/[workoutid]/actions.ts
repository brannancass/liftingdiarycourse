"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { updateWorkout } from "@/data/workouts"

// Zod schemas for validation
const UpdateWorkoutSchema = z.object({
  id: z.number().int().positive("Invalid workout ID"),
  name: z.string().min(1, "Workout name is required").max(100, "Workout name must be 100 characters or less"),
  exercises: z.array(z.object({
    id: z.number().int().positive().optional(),
    name: z.string().min(1, "Exercise name is required").max(100, "Exercise name must be 100 characters or less"),
    order: z.number().int().positive("Exercise order must be positive")
  })).min(1, "At least one exercise is required").max(20, "Maximum 20 exercises allowed")
})

export async function updateWorkoutAction(
  prevState: any,
  data: {
    id: number
    name: string
    exercises: Array<{
      id?: number
      name: string
      order: number
    }>
  }
) {
  try {
    // 1. Validate input
    const validatedData = UpdateWorkoutSchema.parse(data)

    // 2. Call helper function (includes auth check)
    const result = await updateWorkout({
      id: validatedData.id,
      name: validatedData.name,
      exercises: validatedData.exercises
    })

    // 3. Revalidate cache
    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/workout/${validatedData.id}`)
    revalidatePath("/dashboard/workouts")

    return {
      success: true,
      workout: result.workout,
      message: "Workout updated successfully",
      redirectTo: `/dashboard/workout/${validatedData.id}`
    }

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input data",
        fieldErrors: error.flatten().fieldErrors
      }
    }

    // Handle authentication/authorization errors
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return {
          success: false,
          error: "You must be logged in to update workouts"
        }
      }
      if (error.message === "Workout not found") {
        return {
          success: false,
          error: "Workout not found or you don't have permission to edit it"
        }
      }
    }

    // Handle other errors
    console.error("Failed to update workout:", error)
    return {
      success: false,
      error: "Failed to update workout. Please try again."
    }
  }
}