"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const DEFAULT_CALLBACK_URL = "/dashboard";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? DEFAULT_CALLBACK_URL;

  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 sm:py-28">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-white dark:bg-gray-900 p-10 shadow-sm">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Welcome to HabitLab</h1>
          <p className="text-foreground/70">
            Sign in with Google to save your progress and access your habits.
          </p>
        </div>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full inline-flex items-center justify-center px-8 py-3 font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
