# Data Mutations Standards

This document outlines the data mutations standards and guidelines for this project.

## Server Actions Only

**ALL data mutations in this application MUST be done via Server Actions in colocated `actions.ts` files. Server Actions must call helper functions from the `/data` directory.**

### Key Rules

- ✅ **Use Server Actions exclusively** - All data mutations must happen via Server Actions
- ✅ **Colocated actions.ts files** - Server Actions must be in `actions.ts` files alongside components
- ✅ **Helper functions required** - Server Actions must call helper functions from `/data` directory
- ✅ **Typed parameters** - Server Action parameters must be strongly typed (NO FormData)
- ✅ **Zod validation** - ALL Server Action parameters must be validated using Zod schemas
- ❌ **NO direct database calls in actions** - Server Actions must not call database directly
- ❌ **NO redirect() in Server Actions** - Redirects must be handled client-side after Server Action resolves

## Helper Functions Architecture

### Database Mutation Functions

All database mutations MUST be implemented as helper functions in the `/data` directory using Drizzle ORM:

```typescript
// /data/exercises.ts
import { db } from "@/db"
import { exercises } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/auth"

export async function createExercise(data: {
  name: string
  muscle_group: string
  userId: string
}) {
  return await db
    .insert(exercises)
    .values({
      name: data.name,
      muscleGroup: data.muscle_group,
      userId: data.userId,
      createdAt: new Date()
    })
    .returning()
}

export async function updateExercise(
  exerciseId: string,
  data: { name?: string; muscle_group?: string },
  userId: string
) {
  return await db
    .update(exercises)
    .set({
      name: data.name,
      muscleGroup: data.muscle_group,
      updatedAt: new Date()
    })
    .where(and(
      eq(exercises.id, exerciseId),
      eq(exercises.userId, userId)
    ))
    .returning()
}

export async function deleteExercise(exerciseId: string, userId: string) {
  return await db
    .delete(exercises)
    .where(and(
      eq(exercises.id, exerciseId),
      eq(exercises.userId, userId)
    ))
    .returning()
}
```

### Drizzle ORM Requirements

- ✅ **Use Drizzle ORM exclusively** - All database mutations must use Drizzle ORM
- ❌ **NO raw SQL queries** - Raw SQL is forbidden for security and maintainability
- ✅ **Use Drizzle methods** - Use insert(), update(), delete() methods
- ✅ **Use returning()** - Always use .returning() to get mutation results
- ✅ **Use Drizzle operators** - Use eq(), and(), or() for conditions

## Server Actions Implementation

### File Structure and Naming

Server Actions MUST be placed in `actions.ts` files colocated with the components that use them:

```
/app
  /dashboard
    ├── page.tsx
    ├── actions.ts          # Server Actions for dashboard
    └── components/
  /exercises
    ├── page.tsx
    ├── actions.ts          # Server Actions for exercises
    ├── [id]/
    │   ├── page.tsx
    │   └── actions.ts      # Server Actions for individual exercise
    └── components/
```

### Zod Schema Validation

ALL Server Actions MUST validate their parameters using Zod schemas:

```typescript
// /app/exercises/actions.ts
"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { createExercise, updateExercise, deleteExercise } from "@/data/exercises"

// Zod schemas for validation
const CreateExerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required").max(100),
  muscle_group: z.string().min(1, "Muscle group is required")
})

const UpdateExerciseSchema = z.object({
  id: z.string().uuid("Invalid exercise ID"),
  name: z.string().min(1, "Exercise name is required").max(100).optional(),
  muscle_group: z.string().min(1, "Muscle group is required").optional()
})

const DeleteExerciseSchema = z.object({
  id: z.string().uuid("Invalid exercise ID")
})

// Server Actions with typed parameters (NOT FormData)
export async function createExerciseAction(data: {
  name: string
  muscle_group: string
}) {
  // 1. Validate input
  const validatedData = CreateExerciseSchema.parse(data)

  // 2. Check authentication
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // 3. Call helper function
  try {
    const [exercise] = await createExercise({
      ...validatedData,
      userId: session.user.id
    })

    // 4. Revalidate and return success
    revalidatePath("/exercises")
    return { success: true, exercise }
  } catch (error) {
    throw new Error("Failed to create exercise")
  }
}

export async function updateExerciseAction(data: {
  id: string
  name?: string
  muscle_group?: string
}) {
  // 1. Validate input
  const validatedData = UpdateExerciseSchema.parse(data)

  // 2. Check authentication
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // 3. Call helper function
  try {
    const [exercise] = await updateExercise(
      validatedData.id,
      {
        name: validatedData.name,
        muscle_group: validatedData.muscle_group
      },
      session.user.id
    )

    // 4. Revalidate
    revalidatePath("/exercises")
    revalidatePath(`/exercises/${validatedData.id}`)
    return { success: true, exercise }
  } catch (error) {
    throw new Error("Failed to update exercise")
  }
}

export async function deleteExerciseAction(data: { id: string }) {
  // 1. Validate input
  const validatedData = DeleteExerciseSchema.parse(data)

  // 2. Check authentication
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // 3. Call helper function
  try {
    await deleteExercise(validatedData.id, session.user.id)

    // 4. Revalidate and return success
    revalidatePath("/exercises")
    return { success: true, message: "Exercise deleted successfully" }
  } catch (error) {
    return { success: false, error: "Failed to delete exercise" }
  }
}
```

## Parameter Type Requirements

### Strongly Typed Parameters

Server Actions MUST use strongly typed parameters, NOT FormData:

```typescript
// ✅ CORRECT - Typed parameters
export async function createWorkoutAction(data: {
  name: string
  date: string
  exercises: Array<{ exerciseId: string; sets: number; reps: number }>
}) {
  const validatedData = CreateWorkoutSchema.parse(data)
  // ... implementation
}

// ❌ WRONG - FormData parameters forbidden
export async function createWorkoutAction(formData: FormData) {
  const name = formData.get("name") as string // Type unsafe!
  // ... implementation
}
```

### Complex Object Validation

For complex nested objects, use comprehensive Zod schemas:

```typescript
const CreateWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(100),
  date: z.string().datetime("Invalid date format"),
  exercises: z.array(z.object({
    exerciseId: z.string().uuid("Invalid exercise ID"),
    sets: z.number().int().min(1).max(50),
    reps: z.number().int().min(1).max(1000),
    weight: z.number().optional(),
    notes: z.string().max(500).optional()
  })).min(1, "At least one exercise is required")
})
```

## Security Requirements

### User Data Isolation

**CRITICAL**: All data mutations MUST ensure users can only modify their own data:

```typescript
// ✅ CORRECT - Always include user ID in mutations
export async function updateWorkoutAction(data: { id: string; name: string }) {
  const validatedData = UpdateWorkoutSchema.parse(data)
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Helper function ensures user ownership
  const [workout] = await updateWorkout(
    validatedData.id,
    { name: validatedData.name },
    session.user.id // Always pass user ID
  )

  return { success: true, workout }
}

// ❌ WRONG - No user verification
export async function updateWorkoutAction(data: { id: string; name: string }) {
  const validatedData = UpdateWorkoutSchema.parse(data)

  // Missing auth check and user filtering - security vulnerability!
  const [workout] = await db
    .update(workouts)
    .set({ name: validatedData.name })
    .where(eq(workouts.id, validatedData.id))
    .returning()
}
```

### Authentication Pattern

Every Server Action MUST follow this pattern:

1. **Validate input** - Use Zod schemas to validate all parameters
2. **Check authentication** - Verify user session exists
3. **Call helper function** - Use helper functions from `/data` directory
4. **Revalidate cache** - Use `revalidatePath()` to update cached data
5. **Handle errors** - Proper error handling and user feedback

## Error Handling and User Feedback

### Error Handling Pattern

```typescript
export async function createExerciseAction(data: { name: string; muscle_group: string }) {
  try {
    // 1. Validate input
    const validatedData = CreateExerciseSchema.parse(data)

    // 2. Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to create exercises"
      }
    }

    // 3. Call helper function
    const [exercise] = await createExercise({
      ...validatedData,
      userId: session.user.id
    })

    // 4. Revalidate and return success
    revalidatePath("/exercises")
    return {
      success: true,
      exercise,
      message: "Exercise created successfully"
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

    // Handle other errors
    console.error("Failed to create exercise:", error)
    return {
      success: false,
      error: "Failed to create exercise. Please try again."
    }
  }
}
```

## Cache Revalidation

### Required Revalidation

Server Actions MUST revalidate relevant cache paths:

```typescript
export async function updateExerciseAction(data: { id: string; name?: string }) {
  // ... validation and mutation logic

  // Revalidate multiple paths as needed
  revalidatePath("/exercises")                    # List page
  revalidatePath(`/exercises/${data.id}`)         # Detail page
  revalidatePath("/dashboard")                    # Dashboard if it shows exercises

  return { success: true, exercise }
}
```

## Navigation and Redirects

### Client-Side Redirects Only

**Server Actions MUST NOT use the `redirect()` function from Next.js. All navigation after mutations must be handled client-side.**

### Why No Server-Side Redirects

- ✅ **Better user experience** - Client-side redirects allow for loading states and error handling
- ✅ **More predictable behavior** - Server Actions return data, components handle navigation
- ✅ **Easier testing** - Server Actions can be tested independently of navigation logic
- ✅ **Better error handling** - Failed mutations don't trigger unwanted redirects

### Correct Pattern

```typescript
// ✅ CORRECT - Server Action returns success/error data
export async function createExerciseAction(data: { name: string; muscle_group: string }) {
  try {
    const validatedData = CreateExerciseSchema.parse(data)

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const [exercise] = await createExercise({
      ...validatedData,
      userId: session.user.id
    })

    revalidatePath("/exercises")
    return {
      success: true,
      exercise,
      message: "Exercise created successfully"
    }
  } catch (error) {
    return { success: false, error: "Failed to create exercise" }
  }
}
```

```tsx
// ✅ CORRECT - Client component handles navigation
"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { createExerciseAction } from "@/app/exercises/actions"

export function CreateExerciseForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createExerciseAction, null)

  const handleSubmit = async (formData: FormData) => {
    const data = {
      name: formData.get("name") as string,
      muscle_group: formData.get("muscle_group") as string
    }

    const result = await formAction(data)

    // Handle navigation client-side based on result
    if (result?.success && result.exercise) {
      router.push(`/exercises/${result.exercise.id}`)
    }
  }

  return (
    <form action={handleSubmit}>
      {/* form content */}
    </form>
  )
}
```

### Wrong Pattern

```typescript
// ❌ WRONG - Using redirect() in Server Action
export async function createExerciseAction(data: { name: string; muscle_group: string }) {
  const validatedData = CreateExerciseSchema.parse(data)

  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const [exercise] = await createExercise({
    ...validatedData,
    userId: session.user.id
  })

  revalidatePath("/exercises")
  redirect(`/exercises/${exercise.id}`) // ❌ DON'T DO THIS
}
```

### Navigation Patterns

#### 1. Redirect After Success

```tsx
const handleSubmit = async (formData: FormData) => {
  const result = await formAction(data)

  if (result?.success) {
    router.push("/exercises") // Navigate to list
    // or router.push(`/exercises/${result.exercise.id}`) // Navigate to detail
  }
}
```

#### 2. Stay on Page with Success Message

```tsx
const handleSubmit = async (formData: FormData) => {
  const result = await formAction(data)

  if (result?.success) {
    // Show success message, stay on current page
    toast.success("Exercise created successfully!")
    // Form can be reset or kept for creating another
  }
}
```

#### 3. Conditional Navigation

```tsx
const handleSubmit = async (formData: FormData) => {
  const result = await formAction(data)

  if (result?.success) {
    if (shouldRedirect) {
      router.push(`/exercises/${result.exercise.id}`)
    } else {
      toast.success("Exercise created!")
      // Stay on form for bulk creation
    }
  }
}
```

## Directory Structure

```
/data
  ├── exercises.ts         # Exercise mutation helpers
  ├── workouts.ts          # Workout mutation helpers
  ├── users.ts             # User mutation helpers
  └── index.ts             # Export all helpers

/app
  /exercises
    ├── actions.ts         # Exercise Server Actions
    ├── page.tsx
    └── [id]/
        ├── actions.ts     # Individual exercise actions
        └── page.tsx
  /workouts
    ├── actions.ts         # Workout Server Actions
    ├── page.tsx
    └── [id]/
        ├── actions.ts     # Individual workout actions
        └── page.tsx
```

## Examples

### Good ✅

```typescript
// /data/workouts.ts
import { db } from "@/db"
import { workouts, workoutExercises } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function createWorkoutWithExercises(
  workoutData: { name: string; date: Date; userId: string },
  exercises: Array<{ exerciseId: string; sets: number; reps: number }>
) {
  return await db.transaction(async (tx) => {
    // Create workout
    const [workout] = await tx
      .insert(workouts)
      .values(workoutData)
      .returning()

    // Create workout exercises
    const workoutExerciseData = exercises.map(exercise => ({
      workoutId: workout.id,
      exerciseId: exercise.exerciseId,
      sets: exercise.sets,
      reps: exercise.reps
    }))

    const createdExercises = await tx
      .insert(workoutExercises)
      .values(workoutExerciseData)
      .returning()

    return { workout, exercises: createdExercises }
  })
}
```

```typescript
// /app/workouts/actions.ts
"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { createWorkoutWithExercises } from "@/data/workouts"

const CreateWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().datetime(),
  exercises: z.array(z.object({
    exerciseId: z.string().uuid(),
    sets: z.number().int().min(1),
    reps: z.number().int().min(1)
  })).min(1)
})

export async function createWorkoutAction(data: {
  name: string
  date: string
  exercises: Array<{ exerciseId: string; sets: number; reps: number }>
}) {
  try {
    const validatedData = CreateWorkoutSchema.parse(data)

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const result = await createWorkoutWithExercises(
      {
        name: validatedData.name,
        date: new Date(validatedData.date),
        userId: session.user.id
      },
      validatedData.exercises
    )

    revalidatePath("/workouts")
    return {
      success: true,
      workout: result.workout,
      message: "Workout created successfully"
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid data",
        fieldErrors: error.flatten().fieldErrors
      }
    }
    return { success: false, error: "Failed to create workout" }
  }
}
```

### Bad ❌

```typescript
// ❌ FormData parameters (forbidden)
export async function createWorkoutAction(formData: FormData) {
  const name = formData.get("name") as string // Type unsafe!
  // ... rest of implementation
}

// ❌ No Zod validation (forbidden)
export async function updateExerciseAction(data: { id: string; name: string }) {
  // Missing validation - data could be malformed!
  const session = await auth()
  // ... rest of implementation
}

// ❌ Direct database calls in Server Action (forbidden)
export async function deleteWorkoutAction(data: { id: string }) {
  const session = await auth()

  // Should use helper function instead!
  await db
    .delete(workouts)
    .where(eq(workouts.id, data.id))
}

// ❌ Missing user ID filtering (security vulnerability)
export async function updateWorkoutAction(data: { id: string; name: string }) {
  const validatedData = UpdateWorkoutSchema.parse(data)

  // Missing user ownership check!
  await updateWorkout(validatedData.id, { name: validatedData.name })
}

// ❌ No revalidation (cache won't update)
export async function createExerciseAction(data: { name: string }) {
  // ... validation and creation logic

  // Missing revalidatePath() - UI won't update!
  return { success: true }
}
```

## Form Integration

### Using Server Actions with Forms

```tsx
// components/create-exercise-form.tsx
"use client"

import { useActionState } from "react"
import { createExerciseAction } from "@/app/exercises/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CreateExerciseForm() {
  const [state, formAction, isPending] = useActionState(createExerciseAction, null)

  const handleSubmit = async (formData: FormData) => {
    // Convert FormData to typed object
    const data = {
      name: formData.get("name") as string,
      muscle_group: formData.get("muscle_group") as string
    }

    // Call Server Action with typed data
    await formAction(data)
  }

  return (
    <form action={handleSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Exercise Name</Label>
          <Input
            id="name"
            name="name"
            required
            disabled={isPending}
          />
          {state?.fieldErrors?.name && (
            <p className="text-red-500 text-sm">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        <div>
          <Label htmlFor="muscle_group">Muscle Group</Label>
          <Input
            id="muscle_group"
            name="muscle_group"
            required
            disabled={isPending}
          />
          {state?.fieldErrors?.muscle_group && (
            <p className="text-red-500 text-sm">{state.fieldErrors.muscle_group[0]}</p>
          )}
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Exercise"}
        </Button>

        {state?.error && (
          <p className="text-red-500 text-sm">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-green-500 text-sm">Exercise created successfully!</p>
        )}
      </div>
    </form>
  )
}
```

## Enforcement

These standards are **mandatory** for all data mutations in this project. Code reviews should verify:

1. All Server Actions are in colocated `actions.ts` files
2. All Server Actions use typed parameters (NO FormData)
3. All Server Actions validate input using Zod schemas
4. All database mutations use helper functions from `/data` directory
5. All helper functions use Drizzle ORM exclusively
6. Proper user authentication and data isolation is implemented
7. Cache revalidation is included after mutations
8. Proper error handling and user feedback is implemented
9. NO redirect() calls in Server Actions - navigation handled client-side