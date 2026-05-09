import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-28 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-8">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground">
            Build Better <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Habits</span>
          </h1>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Track your daily habits and monitor your progress with a quick energy check-in designed for consistency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/check-in"
              className="inline-flex items-center justify-center px-8 py-3 font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              Start Check-in →
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 py-3 font-semibold text-foreground border border-border rounded-lg hover:bg-foreground/5 transition-all"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-foreground/5 dark:bg-foreground/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-border hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Metrics</h3>
              <p className="text-foreground/70">
                Log your daily energy in seconds and keep a simple pulse on how your day is going.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-border hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Visualize Progress</h3>
              <p className="text-foreground/70">
                See your progress over time with intuitive charts and easy-to-read dashboards.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-border hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Build Habits</h3>
              <p className="text-foreground/70">
                Create and track custom habits to build consistency and achieve your goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-r from-primary to-secondary p-12 rounded-2xl text-white text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to Start?</h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto">
            Begin your habit tracking journey today and see the transformation.
          </p>
          <Link
            href="/check-in"
            className="inline-block px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
}
