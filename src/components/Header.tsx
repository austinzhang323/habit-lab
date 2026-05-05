import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur dark:bg-black/80">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white">
            ✓
          </span>
          <span>HabitLab</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/dashboard"
            className="text-foreground/70 hover:text-foreground font-medium transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/check-in"
            className="text-foreground/70 hover:text-foreground font-medium transition-colors"
          >
            Check In
          </Link>
          <Link
            href="/habits"
            className="text-foreground/70 hover:text-foreground font-medium transition-colors"
          >
            Habits
          </Link>
        </div>

        {/* Mobile Menu Indicator */}
        <div className="md:hidden">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
}
