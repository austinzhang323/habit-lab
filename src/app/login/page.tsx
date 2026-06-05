import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center px-4 py-20 sm:py-28">
          <p className="text-foreground/70">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
