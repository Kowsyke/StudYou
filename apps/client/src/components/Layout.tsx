import { useGSAP } from '@gsap/react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  BookOpen,
  ChevronsUpDown,
  CircleUser,
  Command,
  FileText,
  GraduationCap,
  Heart,
  Inbox,
  Info,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Map as MapIcon,
  Palette,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import { type FormEvent, useCallback, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSubmitReport } from '../hooks/useAdmin'
import { ScrambleTextPlugin } from '../lib/gsap/ScrambleTextPlugin.js'
import { gsap } from '../lib/gsap/index.js'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { useProfileStore } from '../store/profileStore'
import { toast } from '../store/toastStore'
import { CommandPalette } from './CommandPalette'
import { PageTransition } from './PageTransition'
import { Avatar } from './ui/avatar'

gsap.registerPlugin(ScrambleTextPlugin)

const swift = [0.16, 1, 0.3, 1] as const

const studentNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/journey', label: 'My journey', icon: MapIcon },
  { to: '/shortlisted', label: 'Shortlisted', icon: Heart },
  { to: '/universities', label: 'Universities', icon: GraduationCap },
  { to: '/resources', label: 'Resources', icon: BookOpen },
]

const adminNav = [
  { to: '/admin', label: 'Insights', icon: BarChart3 },
  { to: '/admin/kb', label: 'Knowledge Base', icon: Palette },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/reports', label: 'Bug reports', icon: Inbox },
  { to: '/admin/notes', label: 'Admin Notes', icon: FileText },
  { to: '/admin/settings', label: 'Settings & Reports', icon: SlidersHorizontal },
  { to: '/resources', label: 'Knowledge Tree', icon: BookOpen },
]

export function Layout() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const logoRef = useRef<HTMLSpanElement>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)

  // ScrambleText on the sidebar tagline on mount
  useGSAP(() => {
    if (!taglineRef.current) return
    gsap.to(taglineRef.current, {
      duration: 1.4,
      scrambleText: {
        text: 'Your UK study roadmap',
        chars: '01!@#$%^&*()_+=',
        speed: 0.4,
        revealDelay: 0.3,
      },
      delay: 0.6,
    })

    // Animate ambient blobs with slow drift
    gsap.to('.ambient-a', {
      x: 60,
      y: 40,
      scale: 1.15,
      duration: 20,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    gsap.to('.ambient-b', {
      x: -50,
      y: -30,
      scale: 1.1,
      duration: 24,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
  })

  // Magnetic logo hover
  const onLogoMove = useCallback((e: React.MouseEvent) => {
    if (!logoRef.current) return
    const rect = logoRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) * 0.25
    const dy = (e.clientY - cy) * 0.25
    gsap.to(logoRef.current, { x: dx, y: dy, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
  }, [])

  const onLogoLeave = useCallback(() => {
    if (!logoRef.current) return
    gsap.to(logoRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'power3.out',
      overwrite: 'auto',
    })
  }, [])

  const nav = user?.role === 'admin' ? adminNav : studentNav

  return (
    <div className="noise-overlay min-h-screen flex">
      <div className="ambient ambient-a" aria-hidden="true" />
      <div className="ambient ambient-b" aria-hidden="true" />
      <aside className="glass-side w-[260px] shrink-0 border-r border-hairline flex flex-col fixed inset-y-0 select-none transition-colors duration-200 z-10">
        <div className="px-5 pt-6 pb-4">
          <Link
            to="/"
            aria-label="StudYou home"
            className="flex items-center gap-2 text-body-lg font-bold tracking-[-0.01em] rounded-sm w-fit"
          >
            <span
              ref={logoRef}
              onMouseMove={onLogoMove}
              onMouseLeave={onLogoLeave}
              className="breathe w-5 h-5 rounded-xs bg-accent-solid text-white text-caption font-extrabold flex items-center justify-center [background-image:var(--accent-gradient)] transition-transform duration-[120ms] hover:rotate-6 hover:scale-110"
            >
              SY
            </span>
            StudYou
          </Link>
          <p ref={taglineRef} className="text-caption text-ink-tertiary mt-1">
            Your UK study roadmap
          </p>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto">
          <p className="text-micro font-semibold uppercase tracking-[0.05em] text-ink-tertiary mx-2 mt-2 mb-1.5">
            Workspace
          </p>
          <div className="space-y-0.5">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/' || item.to === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-2.5 px-2.5 h-9 rounded-sm text-body font-medium transition-colors duration-[120ms]',
                    isActive
                      ? 'bg-accent-soft text-accent font-semibold'
                      : 'text-ink-secondary hover:bg-surface-secondary hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-indicator"
                        transition={{ duration: 0.3, ease: swift }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full [background-image:var(--accent-gradient)]"
                        aria-hidden="true"
                      />
                    )}
                    <item.icon
                      size={16}
                      strokeWidth={2}
                      className="transition-transform duration-[120ms] group-hover:scale-110"
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="px-3 pb-3">
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-sm text-body text-ink-secondary hover:bg-surface-secondary hover:text-ink transition-colors duration-[120ms]"
          >
            <Command size={15} />
            Search
            <kbd className="ml-auto font-mono text-micro font-medium bg-canvas border border-hairline rounded-xs px-1.5 py-0.5 text-ink-tertiary">
              Ctrl K
            </kbd>
          </button>
        </div>

        {user?.role !== 'admin' && (
          <div className="px-3 pb-3 space-y-0.5">
            <AboutSupportTrigger onOpen={() => setAboutOpen(true)} />
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'w-full flex items-center gap-2.5 px-2.5 h-9 rounded-sm text-body transition-colors duration-[120ms]',
                  isActive
                    ? 'bg-accent-soft text-accent font-semibold'
                    : 'text-ink-secondary hover:bg-surface-secondary hover:text-ink',
                )
              }
            >
              <SlidersHorizontal size={15} />
              Settings
            </NavLink>
          </div>
        )}

        <ProfileBlock
          onSignOut={() => {
            clearAuth()
            navigate('/login')
          }}
        />
      </aside>

      <main className="flex-1 min-w-0 ml-[260px] relative z-[1]">
        <div className="max-w-5xl mx-auto px-10 py-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
          <footer className="mt-12 pb-4 text-caption text-ink-tertiary text-center leading-relaxed">
            StudYou provides guidance and signposting only. It is not legal or immigration advice.
            Always confirm details on official sources such as gov.uk.
          </footer>
        </div>
      </main>

      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
      <AboutSupportDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  )
}

function AboutSupportTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-sm text-body text-ink-secondary hover:bg-surface-secondary hover:text-ink transition-colors duration-[120ms]"
    >
      <LifeBuoy size={15} />
      About and support
    </button>
  )
}

function AboutSupportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [category, setCategory] = useState('bug')
  const [message, setMessage] = useState('')
  const submitReport = useSubmitReport()

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    submitReport.mutate(
      { category, message, pagePath: window.location.pathname },
      {
        onSuccess: () => {
          toast.success('Thank you, your report is with us.')
          setMessage('')
          onClose()
        },
        onError: () => toast.error('Could not send the report. Try again.'),
      },
    )
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[4px] flex items-center justify-center px-4"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.65, 0, 0.35, 1] }}
        aria-labelledby="about-title"
        className="glass-reflect static bg-surface text-ink rounded-lg border border-hairline shadow-overlay p-6 w-[440px] max-w-full flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <span className="h-9 w-9 shrink-0 rounded-sm bg-accent-soft text-accent flex items-center justify-center">
            <Info size={17} />
          </span>
          <div>
            <h2 id="about-title" className="text-body-lg font-bold text-ink">
              About StudYou
            </h2>
            <p className="text-body text-ink-secondary leading-relaxed mt-1">
              StudYou is a transparent, trackable roadmap for studying in the UK, built to replace
              unreliable agencies with official sources. Guidance and signposting only, never legal
              or immigration advice.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3 border-t border-hairline pt-4">
          <p className="text-body font-semibold text-ink">Found a bug or have an idea? Tell us.</p>
          <fieldset className="flex flex-wrap gap-1.5 border-0" aria-label="Report category">
            {[
              { value: 'bug', label: 'Bug' },
              { value: 'data', label: 'Wrong data' },
              { value: 'idea', label: 'Idea' },
              { value: 'account', label: 'Account' },
              { value: 'other', label: 'Other' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                aria-pressed={category === option.value}
                className={cn(
                  'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-[120ms]',
                  category === option.value
                    ? 'bg-accent-solid border-transparent text-white shadow-sm [background-image:var(--accent-gradient)]'
                    : 'bg-surface border-hairline-strong text-ink-secondary hover:bg-surface-secondary hover:text-ink',
                )}
              >
                {option.label}
              </button>
            ))}
          </fieldset>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            placeholder="What happened, what did you expect, and on which page?"
            className="w-full px-3 py-2 rounded-sm bg-surface border border-hairline-strong text-body text-ink placeholder:text-ink-tertiary outline-none transition-[border-color,box-shadow] duration-[120ms] hover:border-ink-tertiary focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]"
          />
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-sm text-body font-semibold bg-surface text-ink border border-hairline-strong shadow-sm hover:bg-surface-secondary transition-all duration-[120ms]"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitReport.isPending}
              className="sheen h-9 px-3.5 rounded-sm text-body font-semibold bg-accent-solid text-white shadow-md [background-image:var(--accent-gradient)] transition-all duration-[120ms] active:scale-[0.98] disabled:opacity-50"
            >
              {submitReport.isPending ? 'Sending...' : 'Send report'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

/* The profile block opens a small menu with the profile link and sign
   out. Settings lives in the sidebar footer, not here. */
function ProfileBlock({ onSignOut }: { onSignOut: () => void }) {
  const user = useAuthStore((s) => s.user)
  const shortlistCount = useProfileStore((s) => s.shortlistIds.length)
  const [open, setOpen] = useState(false)

  return (
    <div className="relative border-t border-hairline">
      {open && (
        <>
          <button
            className="fixed inset-0 z-30 cursor-default"
            aria-label="Close profile menu"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-full left-3 right-3 mb-2 z-40 bg-surface border border-hairline-strong rounded-md shadow-overlay overflow-hidden"
          >
            {user?.role !== 'admin' && (
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3.5 h-9 text-body text-ink-secondary hover:bg-surface-secondary hover:text-ink transition-colors duration-[120ms]"
              >
                <CircleUser size={15} />
                My profile
                {shortlistCount > 0 && (
                  <span className="ml-auto text-micro font-bold text-accent bg-accent-soft rounded-full px-1.5 py-0.5 tabular-nums">
                    {shortlistCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-2.5 px-3.5 h-9 text-body text-ink-secondary hover:bg-danger-soft hover:text-danger transition-colors duration-[120ms] border-t border-hairline"
              aria-label="Sign out"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </motion.div>
        </>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-surface-secondary transition-colors duration-[120ms] text-left"
      >
        <Avatar fullName={user?.fullName} size={32} />
        <span className="min-w-0 flex-1">
          <span className="block text-body font-semibold truncate">{user?.fullName}</span>
          <span className="block text-caption text-ink-tertiary capitalize">{user?.role}</span>
        </span>
        <ChevronsUpDown size={14} className="text-ink-tertiary shrink-0" />
      </button>
    </div>
  )
}
