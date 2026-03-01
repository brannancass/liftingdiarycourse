# Data Fetching Standards

This document outlines the data fetching standards and security guidelines for this project.

## Server Components Only

**ALL data fetching in this application MUST be done via Server Components. Route handlers should NOT be used for data fetching.**

### Key Rules

- ✅ **Use Server Components exclusively** - All data fetching must happen in Server Components
- ❌ **NO route handlers for data fetching** - API routes should only be used for mutations and external webhooks
- ✅ **Leverage React Server Components** - Take advantage of server-side data fetching capabilities
- ✅ **Use helper functions from /data directory** - All database queries must go through helper functions

## Database Query Standards

### Helper Functions Required

All database queries MUST be implemented as helper functions in the `/data` directory:

```typescript
// /data/exercises.ts
import { db } from "@/db"
import { exercises } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/auth" // Your auth implementation

export async function getUserExercises() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  return await db
    .select()
    .from(exercises)
    .where(eq(exercises.userId, session.user.id))
}
```

### Drizzle ORM Only

- ✅ **Use Drizzle ORM exclusively** - All database queries must use Drizzle ORM
- ❌ **NO raw SQL queries** - Raw SQL is forbidden for security and maintainability reasons
- ✅ **Use Drizzle query builders** - Leverage select(), insert(), update(), delete() methods
- ✅ **Use Drizzle operators** - Use eq(), and(), or(), like() for query conditions

## Security Requirements

### User Data Isolation

**CRITICAL**: Logged-in users MUST only access their own data. No user should ever be able to access another user's data.

### Implementation Pattern

```typescript
// ✅ CORRECT - Always filter by user ID
export async function getUserWorkouts() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, session.user.id))
}

// ❌ WRONG - No user filtering
export async function getAllWorkouts() {
  return await db.select().from(workouts) // Security vulnerability!
}
```

### Authentication Checks

Every data helper function MUST:

1. **Check authentication** - Verify user session exists
2. **Extract user ID** - Get the authenticated user's ID
3. **Filter by user ID** - Include userId in all queries
4. **Handle unauthorized access** - Throw errors for invalid sessions

## Server Component Usage

### Data Fetching in Components

```tsx
// app/dashboard/page.tsx
import { getUserExercises } from "@/data/exercises"
import { ExerciseList } from "@/components/exercise-list"

export default async function DashboardPage() {
  // ✅ Fetch data in Server Component
  const exercises = await getUserExercises()

  return (
    <div>
      <h1>Your Exercises</h1>
      <ExerciseList exercises={exercises} />
    </div>
  )
}
```

### Error Handling

```tsx
// app/workouts/page.tsx
import { getUserWorkouts } from "@/data/workouts"
import { redirect } from "next/navigation"

export default async function WorkoutsPage() {
  try {
    const workouts = await getUserWorkouts()
    return <WorkoutsList workouts={workouts} />
  } catch (error) {
    // Handle unauthorized access
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/login")
    }
    throw error
  }
}
```

## Directory Structure

```
/data
  ├── exercises.ts     # Exercise-related queries
  ├── workouts.ts      # Workout-related queries
  ├── users.ts         # User-related queries
  └── index.ts         # Export all helpers
```

## Examples

### Good ✅

```typescript
// /data/workouts.ts
import { db } from "@/db"
import { workouts, exercises } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { auth } from "@/auth"

export async function getUserWorkoutsWithExercises() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  return await db
    .select({
      id: workouts.id,
      name: workouts.name,
      date: workouts.date,
      exercises: exercises
    })
    .from(workouts)
    .leftJoin(exercises, eq(exercises.workoutId, workouts.id))
    .where(eq(workouts.userId, session.user.id))
    .orderBy(desc(workouts.date))
}
```

```tsx
// app/workouts/page.tsx
import { getUserWorkoutsWithExercises } from "@/data/workouts"

export default async function WorkoutsPage() {
  const workouts = await getUserWorkoutsWithExercises()

  return (
    <div>
      {workouts.map(workout => (
        <div key={workout.id}>{workout.name}</div>
      ))}
    </div>
  )
}
```

### Bad ❌

```typescript
// ❌ Route handler for data fetching (forbidden)
// app/api/workouts/route.ts
export async function GET() {
  const workouts = await db.select().from(workouts)
  return Response.json(workouts)
}

// ❌ Raw SQL query (forbidden)
export async function getUserData(userId: string) {
  const result = await db.execute(
    sql`SELECT * FROM users WHERE id = ${userId}` // Raw SQL forbidden!
  )
  return result
}

// ❌ No user ID filtering (security vulnerability)
export async function getWorkouts() {
  return await db.select().from(workouts) // Missing user filter!
}
```

```tsx
// ❌ Client-side data fetching (forbidden)
"use client"
import { useEffect, useState } from "react"

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState([])

  useEffect(() => {
    fetch('/api/workouts') // Should use Server Component instead!
      .then(res => res.json())
      .then(setWorkouts)
  }, [])

  return <div>{/* render workouts */}</div>
}
```

## When to Use Route Handlers

Route handlers should ONLY be used for:

- ✅ **Data mutations** - Creating, updating, deleting data via form actions
- ✅ **External webhooks** - Handling third-party service callbacks
- ✅ **File uploads** - Processing file upload requests
- ❌ **Data fetching** - Use Server Components instead

## Enforcement

These standards are **mandatory** for all data fetching in this project. Code reviews should verify:

1. No route handlers are used for data fetching
2. All database queries use helper functions from `/data` directory
3. All queries use Drizzle ORM (no raw SQL)
4. Every query includes proper user authentication and filtering
5. Server Components are used for all data fetching operations
6. Proper error handling for unauthorized access is implemented