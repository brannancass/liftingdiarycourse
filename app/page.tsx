import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      <main className="flex w-full max-w-4xl flex-col items-center justify-center px-8 py-16 text-center">
        <div className="mb-8">
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-6xl">
            Track Your Fitness Journey
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-zinc-600 dark:text-zinc-400">
            Your personal lifting diary to log workouts, track progress, and achieve your fitness goals.
          </p>
        </div>

        <SignedOut>
          <div className="mb-12">
            <div className="flex flex-col gap-4 sm:flex-row">
              <p className="text-lg text-zinc-700 dark:text-zinc-300">
                Ready to start your fitness journey? Sign in to access your dashboard.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-800">
              <div className="mb-4 text-3xl">💪</div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Log Workouts
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Record your exercises, sets, reps, and weights with ease.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-800">
              <div className="mb-4 text-3xl">📊</div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Track Progress
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Visualize your strength gains and monitor your fitness journey.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-800">
              <div className="mb-4 text-3xl">🎯</div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Stay Motivated
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Set goals and celebrate achievements to stay consistent.
              </p>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="mb-8">
            <p className="text-xl text-zinc-700 dark:text-zinc-300 mb-6">
              Welcome back! Ready to continue your fitness journey?
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </SignedIn>
      </main>
    </div>
  );
}