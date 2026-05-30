import Link from 'next/link'
import { ArrowRight, BarChart3, Lock, PieChart, TrendingUp, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-blue-800/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">WealthIQ</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-slate-400 hover:text-white transition-colors duration-200 text-sm font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="btn-primary text-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/15 border border-blue-500/30 text-blue-400 text-sm font-medium mb-8">
          <Zap className="w-3.5 h-3.5" />
          <span>Phase 1 — Portfolio Intelligence</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
          Your Entire Wealth.
          <br />
          <span className="gradient-text">One Dashboard.</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop juggling spreadsheets and multiple apps. WealthIQ unifies all your assets — stocks,
          real estate, crypto, retirement — into one intelligent, real-time view of your financial life.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-200 hover:shadow-button-glow text-base"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-8 py-3.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-all duration-200 text-base"
          >
            Sign In
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-16 pt-16 border-t border-white/5">
          {[
            { label: 'Asset Classes Supported', value: '10+' },
            { label: 'Data Encryption', value: 'AES-256' },
            { label: 'Setup Time', value: '< 5 min' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Everything you need to master your wealth
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Built for serious investors who want clarity, not complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1: Unified View */}
          <div className="card-dark-hover p-6 group">
            <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center mb-5 group-hover:bg-blue-600/25 transition-colors duration-200">
              <PieChart className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">Unified Portfolio View</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              See your net worth in real-time across stocks, bonds, real estate, crypto, cash, and
              alternative investments — all in one place with beautiful visualizations.
            </p>
            <ul className="mt-4 space-y-2">
              {['Multi-currency support', 'Automatic categorization', 'Historical tracking'].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Feature 2: Risk Analysis */}
          <div className="card-dark-hover p-6 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/15 border border-cyan-500/30 flex items-center justify-center mb-5 group-hover:bg-cyan-600/25 transition-colors duration-200">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">AI-Powered Risk Analysis</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Understand your portfolio&apos;s risk profile with intelligent analytics. Get alerts when
              concentration risk, drawdowns, or correlation issues need attention.
            </p>
            <ul className="mt-4 space-y-2">
              {['Concentration alerts', 'Performance benchmarking', 'Trend detection'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Feature 3: Security */}
          <div className="card-dark-hover p-6 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center mb-5 group-hover:bg-emerald-600/25 transition-colors duration-200">
              <Lock className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">Bank-Grade Security</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your financial data is protected with AES-256 encryption at rest, secure JWT
              authentication, and optional two-factor authentication for peace of mind.
            </p>
            <ul className="mt-4 space-y-2">
              {['AES-256 encryption', 'JWT authentication', '2FA support (Phase 5)'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="card-dark p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/5 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4">
              Start tracking your wealth today
            </h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              Join thousands of investors who have already gained clarity on their financial future.
              Free to use. No credit card required.
            </p>
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-200 hover:shadow-button-glow"
            >
              Create Your Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6 text-center text-slate-600 text-sm">
        <p>&copy; {new Date().getFullYear()} WealthIQ. Your data, your control.</p>
      </footer>
    </main>
  )
}
