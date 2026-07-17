import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  BookOpen,
  Command,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  SlidersHorizontal,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { CommandPalette } from './CommandPalette'

const swift = [0.16, 1, 0.3, 1] as const

const studentNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/journey', label: 'My journey', icon: MapIcon },
  { to: '/resources', label: 'Resources', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: SlidersHorizontal },
]

const adminNav = [
  { to: '/admin', label: 'Insights', icon: BarChart3 },
  { to: '/resources', label: 'Resources', icon: BookOpen },
]

export function Layout() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const location = useLocation()
  const [paletteOpen, setPaletteOpen] = useState(false)

  const nav = user?.role === 'admin' ? adminNav : studentNav

  return (
    <div className="min-h-screen flex">
      <aside className="w-[260px] shrink-0 border-r border-hairline bg-surface flex flex-col fixed inset-y-0 select-none transition-colors duration-200">
        <div className="px-5 pt-6 pb-4">
          <span className="flex items-center gap-2 text-body-lg font-bold tracking-[-0.01em]">
            <span className="w-5 h-5 rounded-xs bg-accent-solid text-white text-caption font-extrabold flex items-center justify-center">
              SY
            </span>
            StudYou
          </span>
          <p className="text-caption text-ink-tertiary mt-1">Your UK study roadmap</p>
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
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-2.5 h-9 rounded-sm text-body font-medium transition-colors duration-[120ms]',
                    isActive
                      ? 'bg-accent-soft text-accent font-semibold'
                      : 'text-ink-secondary hover:bg-surface-secondary hover:text-ink',
                  )
                }
              >
                <item.icon size={16} strokeWidth={2} />
                {item.label}
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

        <div className="border-t border-hairline px-5 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-body font-semibold truncate">{user?.fullName}</p>
            <p className="text-caption text-ink-tertiary capitalize">{user?.role}</p>
          </div>
          <button
            onClick={() => {
              clearAuth()
              navigate('/login')
            }}
            className="text-ink-tertiary hover:text-danger transition-colors duration-[120ms] p-1.5 rounded-sm hover:bg-danger-soft"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 ml-[260px]">
        <div className="max-w-5xl mx-auto px-10 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: swift }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
          <footer className="mt-12 pb-4 text-caption text-ink-tertiary text-center leading-relaxed">
            StudYou provides guidance and signposting only. It is not legal or immigration advice.
            Always confirm details on official sources such as gov.uk.
          </footer>
        </div>
      </main>

      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
    </div>
  )
}
