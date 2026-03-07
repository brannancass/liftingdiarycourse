import { db } from "@/src/db"
import { workouts, exercises, sets } from "@/src/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { requireAuth } from "./auth"

export interface WorkoutWithExercises {
  id: number
  name: string
  startedAt: Date
  completedAt: Date | null
  createdAt: Date
  exercises: {
    id: number
    name: string
    order: number
    sets: {
      id: number
      setNumber: number
      reps: number | null
      weightLbs: string | null
    }[]
  }[]
  duration?: number
  type: string
}

export async function getUserWorkouts(): Promise<WorkoutWithExercises[]> {
  const userId = await requireAuth()

  const result = await db
    .select({
      id: workouts.id,
      name: workouts.name,
      startedAt: workouts.startedAt,
      completedAt: workouts.completedAt,
      createdAt: workouts.createdAt,
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      exerciseOrder: exercises.order,
      setId: sets.id,
      setNumber: sets.setNumber,
      reps: sets.reps,
      weightLbs: sets.weightLbs,
    })
    .from(workouts)
    .leftJoin(exercises, eq(exercises.workoutId, workouts.id))
    .leftJoin(sets, eq(sets.exerciseId, exercises.id))
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.startedAt), exercises.order, sets.setNumber)

  // Group exercises and sets by workout
  const workoutMap = new Map<number, WorkoutWithExercises>()
  const exerciseMap = new Map<number, { id: number; name: string; order: number; sets: { id: number; setNumber: number; reps: number | null; weightLbs: string | null }[] }>()

  result.forEach((row) => {
    if (!workoutMap.has(row.id)) {
      const duration = row.completedAt && row.startedAt
        ? Math.floor((row.completedAt.getTime() - row.startedAt.getTime()) / 60000)
        : undefined

      workoutMap.set(row.id, {
        id: row.id,
        name: row.name,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
        createdAt: row.createdAt,
        exercises: [],
        duration,
        type: "Strength", // Default type - could be enhanced with a type field in schema
      })
    }

    const workout = workoutMap.get(row.id)!

    if (row.exerciseId && row.exerciseName) {
      if (!exerciseMap.has(row.exerciseId)) {
        const exercise = {
          id: row.exerciseId,
          name: row.exerciseName,
          order: row.exerciseOrder ?? 0,
          sets: [] as { id: number; setNumber: number; reps: number | null; weightLbs: string | null }[]
        }
        exerciseMap.set(row.exerciseId, exercise)
        workout.exercises.push(exercise)
      }

      const exercise = exerciseMap.get(row.exerciseId)!
      if (row.setId && row.setNumber !== null) {
        exercise.sets.push({
          id: row.setId,
          setNumber: row.setNumber,
          reps: row.reps,
          weightLbs: row.weightLbs,
        })
      }
    }
  })

  return Array.from(workoutMap.values())
}

export async function getUserWorkoutsForDate(date: Date): Promise<WorkoutWithExercises[]> {
  const userId = await requireAuth()

  // Create start and end of day for the given date
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const result = await db
    .select({
      id: workouts.id,
      name: workouts.name,
      startedAt: workouts.startedAt,
      completedAt: workouts.completedAt,
      createdAt: workouts.createdAt,
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      exerciseOrder: exercises.order,
      setId: sets.id,
      setNumber: sets.setNumber,
      reps: sets.reps,
      weightLbs: sets.weightLbs,
    })
    .from(workouts)
    .leftJoin(exercises, eq(exercises.workoutId, workouts.id))
    .leftJoin(sets, eq(sets.exerciseId, exercises.id))
    .where(
      and(
        eq(workouts.userId, userId),
        sql`${workouts.startedAt} >= ${startOfDay}`,
        sql`${workouts.startedAt} <= ${endOfDay}`
      )
    )
    .orderBy(desc(workouts.startedAt), exercises.order, sets.setNumber)

  // Group exercises and sets by workout
  const workoutMap = new Map<number, WorkoutWithExercises>()
  const exerciseMap = new Map<number, { id: number; name: string; order: number; sets: { id: number; setNumber: number; reps: number | null; weightLbs: string | null }[] }>()

  result.forEach((row) => {
    if (!workoutMap.has(row.id)) {
      const duration = row.completedAt && row.startedAt
        ? Math.floor((row.completedAt.getTime() - row.startedAt.getTime()) / 60000)
        : undefined

      workoutMap.set(row.id, {
        id: row.id,
        name: row.name,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
        createdAt: row.createdAt,
        exercises: [],
        duration,
        type: "Strength", // Default type - could be enhanced with a type field in schema
      })
    }

    const workout = workoutMap.get(row.id)!

    if (row.exerciseId && row.exerciseName) {
      if (!exerciseMap.has(row.exerciseId)) {
        const exercise = {
          id: row.exerciseId,
          name: row.exerciseName,
          order: row.exerciseOrder ?? 0,
          sets: [] as { id: number; setNumber: number; reps: number | null; weightLbs: string | null }[]
        }
        exerciseMap.set(row.exerciseId, exercise)
        workout.exercises.push(exercise)
      }

      const exercise = exerciseMap.get(row.exerciseId)!
      if (row.setId && row.setNumber !== null) {
        exercise.sets.push({
          id: row.setId,
          setNumber: row.setNumber,
          reps: row.reps,
          weightLbs: row.weightLbs,
        })
      }
    }
  })

  return Array.from(workoutMap.values())
}

export async function getUserWorkoutById(workoutId: number): Promise<WorkoutWithExercises | null> {
  const userId = await requireAuth()

  const result = await db
    .select({
      id: workouts.id,
      name: workouts.name,
      startedAt: workouts.startedAt,
      completedAt: workouts.completedAt,
      createdAt: workouts.createdAt,
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      exerciseOrder: exercises.order,
      setId: sets.id,
      setNumber: sets.setNumber,
      reps: sets.reps,
      weightLbs: sets.weightLbs,
    })
    .from(workouts)
    .leftJoin(exercises, eq(exercises.workoutId, workouts.id))
    .leftJoin(sets, eq(sets.exerciseId, exercises.id))
    .where(
      and(
        eq(workouts.userId, userId),
        eq(workouts.id, workoutId)
      )
    )
    .orderBy(exercises.order, sets.setNumber)

  if (result.length === 0) {
    return null
  }

  const firstRow = result[0]
  const duration = firstRow.completedAt && firstRow.startedAt
    ? Math.floor((firstRow.completedAt.getTime() - firstRow.startedAt.getTime()) / 60000)
    : undefined

  const workout: WorkoutWithExercises = {
    id: firstRow.id,
    name: firstRow.name,
    startedAt: firstRow.startedAt,
    completedAt: firstRow.completedAt,
    createdAt: firstRow.createdAt,
    exercises: [],
    duration,
    type: "Strength",
  }

  const exerciseMap = new Map<number, { id: number; name: string; order: number; sets: { id: number; setNumber: number; reps: number | null; weightLbs: string | null }[] }>()

  result.forEach((row) => {
    if (row.exerciseId && row.exerciseName) {
      if (!exerciseMap.has(row.exerciseId)) {
        const exercise = {
          id: row.exerciseId,
          name: row.exerciseName,
          order: row.exerciseOrder ?? 0,
          sets: [] as { id: number; setNumber: number; reps: number | null; weightLbs: string | null }[]
        }
        exerciseMap.set(row.exerciseId, exercise)
        workout.exercises.push(exercise)
      }

      const exercise = exerciseMap.get(row.exerciseId)!
      if (row.setId && row.setNumber !== null) {
        exercise.sets.push({
          id: row.setId,
          setNumber: row.setNumber,
          reps: row.reps,
          weightLbs: row.weightLbs,
        })
      }
    }
  })

  return workout
}

export async function createWorkout(data: {
  name: string
  startedAt: Date
  userId: string
  exercises: Array<{
    name: string
    order: number
    sets: Array<{
      setNumber: number
      reps?: number
      weightLbs?: string
    }>
  }>
}): Promise<{ workout: WorkoutWithExercises }> {
  const userId = await requireAuth()

  try {
    // Create workout first
    const [workout] = await db
      .insert(workouts)
      .values({
        name: data.name,
        startedAt: data.startedAt,
        userId: data.userId,
        createdAt: new Date()
      })
      .returning()

    // Create exercises and their sets if provided
    let workoutExercises: { id: number; name: string; order: number; sets: { id: number; setNumber: number; reps: number | null; weightLbs: string | null }[] }[] = []
    if (data.exercises.length > 0) {
      const createdExercises = await db
        .insert(exercises)
        .values(
          data.exercises.map((exercise, index) => ({
            workoutId: workout.id,
            name: exercise.name,
            order: exercise.order ?? index + 1,
            createdAt: new Date(),
            updatedAt: new Date()
          }))
        )
        .returning()

      // Create sets for each exercise
      for (let i = 0; i < createdExercises.length; i++) {
        const exercise = createdExercises[i]
        const exerciseData = data.exercises[i]

        await createSetsForExercise(exercise.id, exerciseData.sets)

        workoutExercises.push({
          id: exercise.id,
          name: exercise.name,
          order: exercise.order,
          sets: exerciseData.sets.map((set, setIndex) => ({
            id: setIndex, // Temporary ID since we don't have the real DB ID
            setNumber: set.setNumber,
            reps: set.reps ?? null,
            weightLbs: set.weightLbs ?? null
          }))
        })
      }
    }

    return {
      workout: {
        id: workout.id,
        name: workout.name,
        startedAt: workout.startedAt,
        completedAt: workout.completedAt,
        createdAt: workout.createdAt,
        exercises: workoutExercises,
        type: "Strength"
      }
    }
  } catch (error) {
    console.error("Error creating workout:", error)
    throw new Error("Failed to create workout")
  }
}

export async function updateWorkout(data: {
  id: number
  name: string
  exercises: Array<{
    id?: number
    name: string
    order: number
    sets: Array<{
      setNumber: number
      reps?: number
      weightLbs?: string
    }>
  }>
}): Promise<{ workout: WorkoutWithExercises }> {
  const userId = await requireAuth()

  try {
    // First, verify the workout belongs to the user
    const existingWorkout = await db
      .select()
      .from(workouts)
      .where(
        and(
          eq(workouts.id, data.id),
          eq(workouts.userId, userId)
        )
      )
      .limit(1)

    if (existingWorkout.length === 0) {
      throw new Error("Workout not found")
    }

    // Update workout name
    const [updatedWorkout] = await db
      .update(workouts)
      .set({ name: data.name })
      .where(
        and(
          eq(workouts.id, data.id),
          eq(workouts.userId, userId)
        )
      )
      .returning()

    // Delete existing exercises for this workout (cascade will delete sets)
    await db
      .delete(exercises)
      .where(eq(exercises.workoutId, data.id))

    // Insert new/updated exercises and their sets
    let workoutExercises: { id: number; name: string; order: number; sets: { id: number; setNumber: number; reps: number | null; weightLbs: string | null }[] }[] = []
    if (data.exercises.length > 0) {
      const createdExercises = await db
        .insert(exercises)
        .values(
          data.exercises.map((exercise) => ({
            workoutId: data.id,
            name: exercise.name,
            order: exercise.order,
            createdAt: new Date(),
            updatedAt: new Date()
          }))
        )
        .returning()

      // Create sets for each exercise
      for (let i = 0; i < createdExercises.length; i++) {
        const exercise = createdExercises[i]
        const exerciseData = data.exercises[i]

        await createSetsForExercise(exercise.id, exerciseData.sets)

        workoutExercises.push({
          id: exercise.id,
          name: exercise.name,
          order: exercise.order,
          sets: exerciseData.sets.map((set, setIndex) => ({
            id: setIndex, // Temporary ID since we don't have the real DB ID
            setNumber: set.setNumber,
            reps: set.reps ?? null,
            weightLbs: set.weightLbs ?? null
          }))
        })
      }
    }

    return {
      workout: {
        id: updatedWorkout.id,
        name: updatedWorkout.name,
        startedAt: updatedWorkout.startedAt,
        completedAt: updatedWorkout.completedAt,
        createdAt: updatedWorkout.createdAt,
        exercises: workoutExercises,
        type: "Strength"
      }
    }
  } catch (error) {
    console.error("Error updating workout:", error)
    if (error instanceof Error && error.message === "Workout not found") {
      throw error
    }
    throw new Error("Failed to update workout")
  }
}

// Helper function to create sets for an exercise
async function createSetsForExercise(exerciseId: number, setsData: Array<{
  setNumber: number
  reps?: number
  weightLbs?: string
}>): Promise<void> {
  if (setsData.length > 0) {
    await db
      .insert(sets)
      .values(
        setsData.map((set) => ({
          exerciseId,
          setNumber: set.setNumber,
          reps: set.reps ?? null,
          weightLbs: set.weightLbs ?? null,
          createdAt: new Date()
        }))
      )
  }
}

// Helper function to update sets for an exercise (delete existing and create new)
async function updateSetsForExercise(exerciseId: number, setsData: Array<{
  setNumber: number
  reps?: number
  weightLbs?: string
}>): Promise<void> {
  // Delete existing sets for this exercise
  await db
    .delete(sets)
    .where(eq(sets.exerciseId, exerciseId))

  // Create new sets
  await createSetsForExercise(exerciseId, setsData)
}
