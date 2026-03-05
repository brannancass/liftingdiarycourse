# Server Components Coding Standards

This document outlines the coding standards and requirements for Server Components in this Next.js 15 project.

## Critical Next.js 15 Requirement: Awaiting Params

**MANDATORY**: In Next.js 15, all `params` and `searchParams` are promises and MUST be awaited before use.

### Key Rules

- ✅ **Always await params** - `params` is a Promise and must be awaited
- ✅ **Always await searchParams** - `searchParams` is also a Promise and must be awaited
- ❌ **NO direct access** - Never access params properties without awaiting first
- ✅ **Type safety** - Use proper TypeScript types for awaited params

### Params Awaiting Pattern

```tsx
// ✅ CORRECT - Always await params first
interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function Page({ params, searchParams }: PageProps) {
  // MUST await params before accessing properties
  const { id } = await params
  const { tab } = await searchParams

  // Now safe to use id and tab
  const data = await getData(id)

  return <div>{/* Component content */}</div>
}
```

```tsx
// ❌ WRONG - Direct access without awaiting (will cause runtime errors)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = params.id // ERROR: params is a Promise, not an object!

  return <div>{id}</div>
}
```

### Multiple Dynamic Segments

```tsx
// ✅ CORRECT - Awaiting params with multiple segments
interface PageProps {
  params: Promise<{
    category: string
    subcategory: string
    id: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { category, subcategory, id } = await params

  // Use destructured values
  const data = await getCategoryData(category, subcategory, id)

  return <div>{/* Component content */}</div>
}
```

### Search Params Handling

```tsx
// ✅ CORRECT - Awaiting searchParams
interface PageProps {
  searchParams: Promise<{
    page?: string
    filter?: string
    sort?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const { page, filter, sort } = await searchParams

  // Convert and validate search params
  const pageNumber = page ? parseInt(page, 10) : 1
  const filterValue = filter || 'all'

  const data = await getData({ page: pageNumber, filter: filterValue, sort })

  return <div>{/* Component content */}</div>
}
```

## Data Fetching in Server Components

### Authentication and Data Access

Server Components MUST follow the data fetching standards:

```tsx
// ✅ CORRECT - Proper data fetching pattern
import { getUserWorkoutById } from "@/data/workouts"
import { notFound, redirect } from "next/navigation"

interface WorkoutPageProps {
  params: Promise<{ workoutId: string }>
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  // 1. Await params first
  const { workoutId } = await params

  // 2. Validate and parse params
  const id = parseInt(workoutId, 10)
  if (isNaN(id)) {
    notFound()
  }

  try {
    // 3. Fetch data using helper functions
    const workout = await getUserWorkoutById(id)

    if (!workout) {
      notFound()
    }

    // 4. Render component
    return (
      <div>
        <h1>{workout.name}</h1>
        {/* Component content */}
      </div>
    )
  } catch (error) {
    // 5. Handle authentication errors
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/login")
    }
    throw error
  }
}
```

### Error Handling Pattern

```tsx
// ✅ CORRECT - Comprehensive error handling
export default async function Page({ params }: PageProps) {
  const { id } = await params

  // Validate params
  if (!id || typeof id !== 'string') {
    notFound()
  }

  const numericId = parseInt(id, 10)
  if (isNaN(numericId) || numericId <= 0) {
    notFound()
  }

  try {
    const data = await fetchData(numericId)

    if (!data) {
      notFound()
    }

    return <DataComponent data={data} />

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        redirect("/login")
      }
      if (error.message === "Not Found") {
        notFound()
      }
    }

    // Re-throw unexpected errors
    throw error
  }
}
```

## TypeScript Types for Server Components

### Proper Type Definitions

```tsx
// ✅ CORRECT - Proper TypeScript types
interface PageProps {
  params: Promise<{
    id: string
    slug?: string
  }>
  searchParams: Promise<{
    page?: string
    limit?: string
    search?: string
  }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id, slug } = await params
  const { page, limit, search } = await searchParams

  // Type-safe usage
  return <div>{/* Component */}</div>
}
```

### Layout Components

```tsx
// ✅ CORRECT - Layout with awaited params
interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ category: string }>
}

export default async function Layout({ children, params }: LayoutProps) {
  const { category } = await params

  // Fetch category-specific data
  const categoryData = await getCategoryData(category)

  return (
    <div>
      <Header category={categoryData} />
      {children}
    </div>
  )
}
```

## Integration with Project Standards

### Following Data Fetching Standards

Server Components MUST use helper functions from the `/data` directory:

```tsx
// ✅ CORRECT - Uses data helpers
import { getUserExercises } from "@/data/exercises"
import { getUserWorkoutById } from "@/data/workouts"

export default async function ExercisePage({ params }: PageProps) {
  const { workoutId } = await params

  // Use helper functions (includes auth checks)
  const [workout, exercises] = await Promise.all([
    getUserWorkoutById(parseInt(workoutId, 10)),
    getUserExercises()
  ])

  return <ExerciseList workout={workout} exercises={exercises} />
}

// ❌ WRONG - Direct database access
import { db } from "@/db"

export default async function ExercisePage({ params }: PageProps) {
  const { workoutId } = await params

  // DON'T DO THIS - bypasses security and standards
  const workout = await db.select().from(workouts).where(eq(workouts.id, workoutId))

  return <div>{/* Component */}</div>
}
```

### UI Component Integration

Server Components should use shadcn/ui components and follow UI standards:

```tsx
// ✅ CORRECT - Uses shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default async function WorkoutPage({ params }: PageProps) {
  const { workoutId } = await params
  const workout = await getUserWorkoutById(parseInt(workoutId, 10))

  if (!workout) notFound()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{workout.name}</CardTitle>
        <p className="text-muted-foreground">
          {format(workout.startedAt, "do MMM yyyy")}
        </p>
      </CardHeader>
      <CardContent>
        <Badge variant="outline">{workout.type}</Badge>
        {/* More content */}
      </CardContent>
    </Card>
  )
}
```

## Common Patterns

### Loading and Not Found

```tsx
// ✅ CORRECT - Proper loading and not found handling
import { Suspense } from "react"
import { notFound } from "next/navigation"

export default async function Page({ params }: PageProps) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DataComponent id={id} />
    </Suspense>
  )
}

async function DataComponent({ id }: { id: string }) {
  const data = await fetchData(id)

  if (!data) {
    notFound()
  }

  return <div>{/* Render data */}</div>
}
```

### Metadata Generation

```tsx
// ✅ CORRECT - Metadata with awaited params
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const data = await fetchData(id)

    return {
      title: data.title,
      description: data.description,
    }
  } catch {
    return {
      title: "Not Found",
      description: "The requested page could not be found."
    }
  }
}
```

## Examples

### Good ✅

```tsx
// Complete example following all standards
import { notFound, redirect } from "next/navigation"
import { getUserWorkoutById } from "@/data/workouts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"

interface WorkoutPageProps {
  params: Promise<{ workoutId: string }>
  searchParams: Promise<{ view?: string }>
}

export default async function WorkoutPage({ params, searchParams }: WorkoutPageProps) {
  // 1. Await params and searchParams
  const { workoutId } = await params
  const { view } = await searchParams

  // 2. Validate and parse
  const id = parseInt(workoutId, 10)
  if (isNaN(id)) {
    notFound()
  }

  try {
    // 3. Fetch data using helper function
    const workout = await getUserWorkoutById(id)

    if (!workout) {
      notFound()
    }

    // 4. Render using shadcn/ui components and date-fns
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>{workout.name}</CardTitle>
            <p className="text-muted-foreground">
              {format(workout.startedAt, "do MMM yyyy")}
            </p>
          </CardHeader>
          <CardContent>
            {view === 'detailed' ? (
              <DetailedView workout={workout} />
            ) : (
              <SummaryView workout={workout} />
            )}
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    // 5. Handle auth errors
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/login")
    }
    throw error
  }
}
```

### Bad ❌

```tsx
// ❌ Multiple violations
export default async function WorkoutPage({ params, searchParams }) {
  // ❌ No TypeScript types
  // ❌ Not awaiting params
  const workoutId = params.workoutId // Will throw runtime error!
  const view = searchParams.view // Will throw runtime error!

  // ❌ Direct database access instead of helper functions
  const workout = await db.select().from(workouts).where(eq(workouts.id, workoutId))

  // ❌ No error handling
  // ❌ Custom components instead of shadcn/ui
  return (
    <CustomCard>
      <h1>{workout.name}</h1>
      {/* ❌ No date formatting with date-fns */}
      <p>{workout.startedAt.toString()}</p>
    </CustomCard>
  )
}
```

## Migration from Next.js 14

If migrating from Next.js 14 code, update all params access:

```tsx
// Next.js 14 (OLD)
export default async function Page({ params }) {
  const { id } = params // Direct access
  // ...
}

// Next.js 15 (NEW - REQUIRED)
export default async function Page({ params }) {
  const { id } = await params // Must await first
  // ...
}
```

## Enforcement

These standards are **mandatory** for all Server Components in this project. Code reviews should verify:

1. All `params` and `searchParams` are awaited before property access
2. Proper TypeScript types are used for params
3. Data fetching uses helper functions from `/data` directory
4. Error handling follows the authentication patterns
5. UI components are from shadcn/ui library
6. Date formatting uses date-fns
7. Proper validation of params before use
8. `notFound()` and `redirect()` are used appropriately

## Common Runtime Errors to Avoid

- `TypeError: Cannot read property 'id' of undefined` - Forgot to await params
- `TypeError: params.id is not a function` - Accessing Promise properties directly
- Authentication bypass - Using direct database queries instead of helper functions
- Type errors - Missing proper TypeScript types for params