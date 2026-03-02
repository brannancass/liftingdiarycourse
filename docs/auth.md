# Authentication Standards

This document outlines the authentication standards and guidelines for this project.

## Authentication Provider

**This application uses Clerk as the exclusive authentication provider. All authentication functionality MUST be implemented using Clerk's SDK and components.**

### Key Rules

- ✅ **Use Clerk exclusively** - All authentication must be handled through Clerk's provided SDK
- ❌ **NO custom auth implementations** - Never implement custom login, signup, or session management
- ✅ **Leverage Clerk components** - Use Clerk's pre-built UI components for authentication flows
- ✅ **Follow Clerk security patterns** - Implement proper middleware and route protection using Clerk's methods

### Installation & Setup

Clerk should be configured with the Next.js SDK:

```bash
npm install @clerk/nextjs
```

Configure environment variables:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

## Authentication Components

### Clerk UI Components

Use Clerk's pre-built components for all authentication flows:

```tsx
import {
  SignIn,
  SignUp,
  UserButton,
  SignOutButton,
  ClerkProvider
} from "@clerk/nextjs"

// Sign in page
export default function SignInPage() {
  return <SignIn />
}

// User profile button
export function UserProfile() {
  return <UserButton />
}
```

### Authentication State

Access user authentication state using Clerk hooks:

```tsx
import { useAuth, useUser } from "@clerk/nextjs"

export function AuthenticatedComponent() {
  const { isLoaded, userId, sessionId } = useAuth()
  const { isLoaded: isUserLoaded, user } = useUser()

  if (!isLoaded || !isUserLoaded) {
    return <div>Loading...</div>
  }

  if (!userId) {
    return <div>Please sign in</div>
  }

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      <SignOutButton />
    </div>
  )
}
```

## Server-Side Authentication

### Middleware Protection

Implement route protection using Clerk middleware:

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/workouts(.*)",
  "/exercises(.*)",
  "/profile(.*)"
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
}
```

### Server Component Authentication

Access user data in Server Components:

```tsx
import { auth, currentUser } from "@clerk/nextjs/server"

export default async function ServerComponentWithAuth() {
  const { userId } = await auth()

  if (!userId) {
    return <div>Please sign in</div>
  }

  const user = await currentUser()

  return (
    <div>
      <h1>Server-side authentication</h1>
      <p>User ID: {userId}</p>
      <p>Email: {user?.emailAddresses[0]?.emailAddress}</p>
    </div>
  )
}
```

### Data Helper Integration

Integrate Clerk authentication with data helpers:

```typescript
// /data/exercises.ts
import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { exercises } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getUserExercises() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized: User not authenticated")
  }

  return await db
    .select()
    .from(exercises)
    .where(eq(exercises.userId, userId))
}
```

## Route Protection Patterns

### Protected Pages

Protect entire page components:

```tsx
// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div>
      <h1>Protected Dashboard</h1>
      {/* Dashboard content */}
    </div>
  )
}
```

### API Route Protection

Protect API routes using Clerk:

```typescript
// app/api/workouts/route.ts
import { auth } from "@clerk/nextjs/server"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Handle authenticated request
  return Response.json({ message: "Protected API endpoint" })
}
```

## User Management

### User Profile Updates

Handle user profile updates through Clerk:

```tsx
import { UserProfile } from "@clerk/nextjs"

export default function ProfilePage() {
  return (
    <div>
      <h1>User Profile</h1>
      <UserProfile />
    </div>
  )
}
```

### Custom User Metadata

Store additional user data:

```typescript
// When creating user-specific records
import { auth } from "@clerk/nextjs/server"

export async function createUserWorkout(workoutData: WorkoutData) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized")
  }

  return await db.insert(workouts).values({
    ...workoutData,
    userId, // Always associate with authenticated user
    createdAt: new Date(),
  })
}
```

## Examples

### Good ✅

```tsx
// ✅ Proper Clerk integration
import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignIn />
    </div>
  )
}
```

```typescript
// ✅ Proper server-side auth check
import { auth } from "@clerk/nextjs/server"

export async function getProtectedData() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized")
  }

  return await fetchUserSpecificData(userId)
}
```

```tsx
// ✅ Proper client-side auth usage
import { useAuth } from "@clerk/nextjs"

export function ClientComponent() {
  const { isLoaded, userId } = useAuth()

  if (!isLoaded) return <div>Loading...</div>
  if (!userId) return <div>Please sign in</div>

  return <div>Authenticated content</div>
}
```

### Bad ❌

```tsx
// ❌ Custom authentication implementation (forbidden)
const customSignIn = async (email: string, password: string) => {
  // Custom auth logic - NEVER do this!
  const response = await fetch("/api/custom-auth", {
    method: "POST",
    body: JSON.stringify({ email, password })
  })
  return response.json()
}
```

```typescript
// ❌ Bypassing Clerk authentication (security risk)
export async function unsafeDataAccess(userId?: string) {
  // No auth check - anyone can access any user's data!
  return await db.select().from(workouts).where(eq(workouts.userId, userId))
}
```

```tsx
// ❌ Storing sensitive auth data in localStorage (forbidden)
const [token, setToken] = useState("")

useEffect(() => {
  // Never store auth tokens manually!
  const storedToken = localStorage.getItem("auth-token")
  setToken(storedToken || "")
}, [])
```

## Security Requirements

### Authentication Flow

**CRITICAL**: All authentication flows MUST go through Clerk. Never implement custom authentication logic.

### Session Management

- ✅ **Use Clerk sessions** - Let Clerk handle session creation, validation, and expiration
- ❌ **NO custom session storage** - Never manually store or manage session data
- ✅ **Leverage Clerk middleware** - Use Clerk's middleware for route protection
- ❌ **NO manual token handling** - Let Clerk handle all token management

### User Data Security

Every operation involving user data MUST:

1. **Authenticate the user** - Verify the user is signed in via Clerk
2. **Extract user ID from Clerk** - Get the authenticated user's ID from `auth()`
3. **Filter by authenticated user** - Only access data belonging to the authenticated user
4. **Handle unauthenticated requests** - Redirect or throw errors for invalid sessions

## Environment Configuration

### Required Environment Variables

```bash
# Clerk Configuration (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Custom domains
NEXT_PUBLIC_CLERK_DOMAIN=auth.yourdomain.com

# Optional: Custom sign-in/up URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### Clerk Provider Setup

```tsx
// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

## Enforcement

These authentication standards are **mandatory** for all development in this project. Code reviews should verify:

1. Only Clerk is used for authentication (no custom auth implementations)
2. All protected routes use Clerk middleware or auth checks
3. All data helpers include proper Clerk authentication
4. User data is properly isolated using authenticated user IDs
5. Clerk UI components are used for all authentication flows
6. No manual session or token management is implemented