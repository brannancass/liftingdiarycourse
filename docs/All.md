# Routing Standards

This document outlines the routing standards and guidelines for this project.

## Route Structure

**ALL application routes must be accessed via the `/dashboard` prefix.**

### Key Rules

- ✅ **Dashboard-first routing** - All application routes must start with `/dashboard`
- ✅ **Protected routes** - All `/dashboard` routes and sub-pages require user authentication
- ✅ **Middleware-based protection** - Route protection must be implemented using Next.js middleware
- ❌ **NO public app routes** - No application functionality should be accessible outside of `/dashboard`

## Authentication & Protection

### Middleware Implementation

Route protection must be handled by Next.js middleware (`middleware.ts`) to ensure all dashboard routes are secured:

```tsx
import { authMiddleware } from "@clerk/nextjs"

export default authMiddleware({
  // Protect all routes starting with /dashboard
  publicRoutes: ["/", "/sign-in", "/sign-up"],
  ignoredRoutes: ["/api/webhooks/(.*)"]
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"]
}
```

### Protected Route Structure

All application functionality must follow this pattern:

```
/dashboard                    # Main dashboard (protected)
/dashboard/workout           # Workout management (protected)
/dashboard/workout/new       # Create new workout (protected)
/dashboard/workout/[id]      # Specific workout (protected)
/dashboard/exercise          # Exercise management (protected)
/dashboard/profile           # User profile (protected)
```

## Route Organization

### File Structure

Routes should be organized in the `app/dashboard/` directory:

```
app/
├── dashboard/
│   ├── layout.tsx          # Dashboard layout wrapper
│   ├── page.tsx            # Dashboard home
│   ├── workout/
│   │   ├── layout.tsx      # Workout section layout
│   │   ├── page.tsx        # Workout list
│   │   ├── new/
│   │   │   └── page.tsx    # New workout form
│   │   └── [workoutid]/
│   │       └── page.tsx    # Workout details
│   └── exercise/
│       ├── page.tsx        # Exercise management
│       └── [exerciseid]/
│           └── page.tsx    # Exercise details
```

### Layout Requirements

Each major section should have its own layout file for consistent navigation and structure:

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav>{/* Dashboard navigation */}</nav>
      <main className="container mx-auto py-6">
        {children}
      </main>
    </div>
  )
}
```

## Examples

### Good ✅

```tsx
// app/dashboard/workout/new/page.tsx
export default function NewWorkoutPage() {
  return (
    <div>
      <h1>Create New Workout</h1>
      {/* Workout creation form */}
    </div>
  )
}

// Navigation links
<Link href="/dashboard/workout/new">Create Workout</Link>
<Link href="/dashboard/exercise">Manage Exercises</Link>
```

### Bad ❌

```tsx
// ❌ Routes outside of dashboard
// app/workout/page.tsx - WRONG
// app/create-workout/page.tsx - WRONG

// ❌ Public application routes
export const config = {
  matcher: ["/((?!workout|exercise).*))"] // Wrong - exposes app routes
}

// ❌ Navigation to non-dashboard routes
<Link href="/workout/new">Create Workout</Link> // Wrong
<Link href="/profile">Profile</Link> // Wrong
```

## Route Parameters

### Dynamic Routes

Use Next.js dynamic routing for resource-specific pages:

```tsx
// app/dashboard/workout/[workoutid]/page.tsx
interface Props {
  params: {
    workoutid: string
  }
}

export default function WorkoutDetailsPage({ params }: Props) {
  const { workoutid } = params
  // Fetch and display workout details
}
```

### Search Parameters

Handle search and filter parameters using Next.js searchParams:

```tsx
// app/dashboard/workout/page.tsx
interface Props {
  searchParams: {
    filter?: string
    sort?: string
  }
}

export default function WorkoutsPage({ searchParams }: Props) {
  const { filter, sort } = searchParams
  // Filter and sort workouts based on parameters
}
```

## Navigation Patterns

### Internal Navigation

All internal navigation must use Next.js Link component and point to dashboard routes:

```tsx
import Link from "next/link"

// Correct navigation patterns
<Link href="/dashboard">Dashboard Home</Link>
<Link href="/dashboard/workout">Workouts</Link>
<Link href="/dashboard/workout/new">New Workout</Link>
```

### Programmatic Navigation

Use Next.js router for programmatic navigation:

```tsx
import { useRouter } from "next/navigation"

export function CreateWorkoutForm() {
  const router = useRouter()

  const handleSubmit = async (data: WorkoutData) => {
    // Save workout
    await saveWorkout(data)

    // Navigate to workout details
    router.push(`/dashboard/workout/${newWorkoutId}`)
  }
}
```

## Enforcement

These routing standards are **mandatory** for all development in this project. Code reviews should verify:

1. All application routes start with `/dashboard`
2. Middleware properly protects all dashboard routes
3. No public application functionality exists outside authentication
4. Proper use of Next.js routing patterns (dynamic routes, layouts)
5. Consistent navigation using dashboard-prefixed routes