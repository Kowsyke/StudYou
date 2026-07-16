import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, BookOpen, Command, LayoutDashboard, LogOut, Map as MapIcon } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { CommandPalette } from './CommandPalette'

const studentNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/journey', label: 'My journey', icon: MapIcon },
  { to: '/resources', label: 'Resources', icon: BookOpen },
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
      <aside className="w-60 shrink-0 border-r border-hairline bg-white/70 backdrop-blur-xl flex flex-col fixed inset-y-0">
        <div className="px-5 pt-6 pb-4">
          <span className="text-lg font-semibold tracking-tight">
            Stud<span className="text-accent">You</span>
          </span>
          <p className="text-xs text-ink-muted mt-0.5">Your UK study roadmap</p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent-soft text-accent-deep'
                    : 'text-ink-secondary hover:bg-black/5 hover:text-ink',
                )
              }
            >
              <item.icon size={16} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-3">
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm text-ink-muted hover:bg-black/5 transition-colors"
          >
            <Command size={15} />
            Search
            <kbd className="ml-auto text-[10px] font-medium bg-canvas border border-hairline rounded px-1.5 py-0.5">
              Ctrl K
            </kbd>
          </button>
        </div>

        <div className="border-t border-hairline px-5 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-xs text-ink-muted capitalize">{user?.role}</p>
          </div>
          <button
            onClick={() => {
              clearAuth()
              navigate('/login')
            }}
            className="text-ink-muted hover:text-danger transition-colors p-1.5 rounded-lg hover:bg-danger-soft"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
          <footer className="mt-12 pb-4 text-xs text-ink-muted text-center">
            StudYou provides guidance and signposting only. It is not legal or immigration advice.
            Always confirm details on official sources such as gov.uk.
          </footer>
        </div>
      </main>

      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
    </div>
  )
}
