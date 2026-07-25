import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  GraduationCap,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { CardTilt } from '../components/CardTilt'
import { Button } from './ui/button'

export function ChoosePathSection() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 my-16 sm:my-24">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-flex items-center gap-1.5 bg-accent-soft text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
          <Compass className="w-3.5 h-3.5" />
          Two Ways To Start
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
          Choose your{' '}
          <span className="gradient-shimmer bg-clip-text text-transparent [background-image:var(--accent-gradient)]">
            path
          </span>
        </h2>
        <p className="text-ink-secondary text-sm sm:text-base mt-3">
          Whether you are comparing top UK universities or setting up your personal deadline
          roadmap.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Card 1: Explore Universities */}
        <CardTilt intensity={5} className="h-full">
          <div className="group relative rounded-3xl border border-white/10 bg-[color:var(--canvas)]/80 p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 hover:border-accent/40 hover:shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Ambient Corner Glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-accent/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

            <div>
              {/* Top Badge */}
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-xs font-bold px-3 py-1 rounded-full">
                  <Building2 className="w-3.5 h-3.5" />
                  Search & Shortlist
                </span>
                <span className="text-xs font-mono text-ink-tertiary">200+ Institutions</span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">Explore UK Universities</h3>
              <p className="text-sm text-ink-secondary leading-relaxed mb-6">
                Browse official UCAS requirements, compare living costs across UK regions, and
                shortlist your top destinations.
              </p>

              {/* Feature Bullets */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-xs sm:text-sm text-ink-secondary">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">200+ Verified UK Universities</strong> with
                    official portal links
                  </span>
                </li>
                <li className="flex items-start gap-3 text-xs sm:text-sm text-ink-secondary">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Regional Cost Breakdown</strong> for London,
                    Scotland, and English regions
                  </span>
                </li>
                <li className="flex items-start gap-3 text-xs sm:text-sm text-ink-secondary">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Interactive Swipe Deck</strong> to shortlist your
                    dream campuses
                  </span>
                </li>
              </ul>

              {/* Mini University Card Widget */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-8 backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
                      OX
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">University of Oxford</h4>
                      <span className="text-[10px] text-ink-tertiary flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-accent" /> South East, UK
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-warning/20 text-warning px-2 py-0.5 rounded-full border border-warning/30">
                    Rank #1
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-ink-secondary pt-2 border-t border-white/5">
                  <span>Tuition: £28,900 / yr</span>
                  <span className="text-positive font-semibold">Russell Group</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link to="/universities" className="w-full">
              <Button
                size="lg"
                variant="primary"
                className="w-full justify-center group-hover:shadow-lg transition-all duration-300"
              >
                Find Universities
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </CardTilt>

        {/* Card 2: Build Your Journey */}
        <CardTilt intensity={5} className="h-full">
          <div className="group relative rounded-3xl border border-white/10 bg-[color:var(--canvas)]/80 p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 hover:border-warning/40 hover:shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Ambient Corner Glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-warning/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

            <div>
              {/* Top Badge */}
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex items-center gap-1.5 bg-warning/10 border border-warning/20 text-warning text-xs font-bold px-3 py-1 rounded-full">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Tracked Roadmap
                </span>
                <span className="text-xs font-mono text-ink-tertiary">21 Official Steps</span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">Build Your Journey</h3>
              <p className="text-sm text-ink-secondary leading-relaxed mb-6">
                Generate a personalized step-by-step roadmap from IELTS prep to visa application and
                landing in the UK.
              </p>

              {/* Feature Bullets */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-xs sm:text-sm text-ink-secondary">
                  <CheckCircle2 className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">21 Official Milestones</strong> sequenced into
                    your target intake date
                  </span>
                </li>
                <li className="flex items-start gap-3 text-xs sm:text-sm text-ink-secondary">
                  <CheckCircle2 className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Budget & Deadline Engines</strong> calculating
                    fees in your home currency
                  </span>
                </li>
                <li className="flex items-start gap-3 text-xs sm:text-sm text-ink-secondary">
                  <CheckCircle2 className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Zero Agent Commissions</strong> with direct
                    official government links
                  </span>
                </li>
              </ul>

              {/* Mini Roadmap Progress Widget */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-8 backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-warning/20 flex items-center justify-center text-warning font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">UK Student Visa Roadmap</h4>
                      <span className="text-[10px] text-ink-tertiary">
                        Target Intake: Sept 2026
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-warning font-mono">85% Done</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-1">
                  <div className="h-full bg-gradient-to-r from-accent to-warning w-[85%]" />
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link to="/register" className="w-full">
              <Button
                size="lg"
                variant="secondary"
                className="w-full justify-center border-warning/40 hover:bg-warning/10 text-warning group-hover:shadow-lg transition-all duration-300"
              >
                Start Free Roadmap
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </CardTilt>
      </div>
    </section>
  )
}
