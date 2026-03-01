import { db } from "@/src/db"
import { workouts, exercises } from "@/src/db/schema"
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
    })
    .from(workouts)
    .leftJoin(exercises, eq(exercises.workoutId, workouts.id))
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.startedAt))

  // Group exercises by workout
  const workoutMap = new Map<number, WorkoutWithExercises>()

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
      workout.exercises.push({
        id: row.exerciseId,
        name: row.exerciseName,
        order: row.exerciseOrder,
      })
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
    })
    .from(workouts)
    .leftJoin(exercises, eq(exercises.workoutId, workouts.id))
    .where(
      and(
        eq(workouts.userId, userId),
        sql`${workouts.startedAt} >= ${startOfDay}`,
        sql`${workouts.startedAt} <= ${endOfDay}`
      )
    )
    .orderBy(desc(workouts.startedAt))

  // Group exercises by workout
  const workoutMap = new Map<number, WorkoutWithExercises>()

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
      workout.exercises.push({
        id: row.exerciseId,
        name: row.exerciseName,
        order: row.exerciseOrder,
      })
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
    })
    .from(workouts)
    .leftJoin(exercises, eq(exercises.workoutId, workouts.id))
    .where(
      and(
        eq(workouts.userId, userId),
        eq(workouts.id, workoutId)
      )
    )

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

  result.forEach((row) => {
    if (row.exerciseId && row.exerciseName) {
      workout.exercises.push({
        id: row.exerciseId,
        name: row.exerciseName,
        order: row.exerciseOrder,
      })
    }
  })

  return workout
}