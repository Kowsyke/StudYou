import { useGSAP } from '@gsap/react'
import type { JourneyOverview, Resource } from '@studyou/types'
import { useQueryClient } from '@tanstack/react-query'
import { Command } from 'cmdk'
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Circle,
  CircleUser,
  GraduationCap,
  Heart,
  LayoutDashboard,
  Map as MapIcon,
  Search as SearchIcon,
  SlidersHorizontal,
} from 'lucide-react'
import { type ReactNode, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScrambleTextPlugin } from '../lib/gsap/ScrambleTextPlugin.js'
import { gsap } from '../lib/gsap/index.js'
import { useAuthStore } from '../store/authStore'

gsap.registerPlugin(useGSAP, ScrambleTextPlugin)

interface CommandPaletteProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function CommandPalette({ open, setOpen }: CommandPaletteProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(!open)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, setOpen])

  const overview = queryClient.getQueryData<JourneyOverview>(['journey'])
  const resourceQueries = queryClient.getQueriesData<Resource[]>({ queryKey: ['resources'] })
  const resources = resourceQueries.flatMap(([, data]) => data ?? [])
  const uniqueResources = [...new Map(resources.map((r) => [r.id, r])).values()]

  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  // 1. GSAP Entrance Transitions
  useGSAP(() => {
    if (open) {
      gsap.fromTo(
        '.cmdk-overlay',
        { opacity: 0 },
        { opacity: 1, duration: 0.28, ease: 'power2.out', overwrite: 'auto' },
      )
      gsap.fromTo(
        '.cmdk-dialog',
        { opacity: 0, scale: 0.94, y: -25 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power3.out', overwrite: 'auto' },
      )
    }
  }, [open])

  // 2. ScrambleText Cycling Placeholders
  useGSAP(() => {
    if (!open) return
    const placeholders = [
      'Jump to a task, resource or page...',
      'Search visa requirements...',
      'Find housing & deposit tips...',
      'Find top UK universities...',
      'Jump to your profile settings...',
    ]
    let index = 0
    const placeholderObj = { text: placeholders[0] }

    const interval = setInterval(() => {
      index = (index + 1) % placeholders.length
      gsap.to(placeholderObj, {
        duration: 1.0,
        scrambleText: {
          text: placeholders[index],
          chars: '01',
          speed: 0.45,
        },
        onUpdate: () => {
          if (inputRef.current) {
            inputRef.current.placeholder = placeholderObj.text
          }
        },
      })
    }, 3800)

    return () => clearInterval(interval)
  }, [open])

  // 3. Sliding Active Item Indicator
  useGSAP(() => {
    if (!open) return

    // Ensure the container is relative
    if (listRef.current) {
      listRef.current.style.position = 'relative'
    }

    let pill = document.querySelector('.palette-active-pill') as HTMLElement
    if (!pill && listRef.current) {
      pill = document.createElement('div')
      pill.className =
        'palette-active-pill absolute left-2 right-2 h-9 rounded-sm bg-surface-secondary/70 pointer-events-none -z-10'
      listRef.current.appendChild(pill)
    }

    const observer = new MutationObserver(() => {
      const activeItem = listRef.current?.querySelector('[data-selected="true"]') as HTMLElement
      if (activeItem && pill && listRef.current) {
        const top = activeItem.offsetTop
        gsap.to(pill, {
          y: top,
          height: activeItem.offsetHeight,
          duration: 0.2,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }
    })

    if (listRef.current) {
      observer.observe(listRef.current, {
        attributes: true,
        subtree: true,
        attributeFilter: ['data-selected'],
      })
    }

    return () => observer.disconnect()
  }, [open])

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global search"
      contentClassName="cmdk-dialog glass-reflect fixed top-[12vh] left-1/2 -translate-x-1/2 w-[min(480px,90vw)] max-h-[76vh] flex flex-col z-50 bg-surface rounded-lg border border-hairline-strong shadow-overlay overflow-hidden select-none"
      overlayClassName="cmdk-overlay fixed inset-0 bg-black/40 backdrop-blur-[4px] z-40"
    >
      <div className="flex items-center gap-3 px-4 border-b border-hairline shrink-0">
        <SearchIcon size={16} className="text-ink-tertiary shrink-0" />
        <Command.Input
          ref={inputRef}
          placeholder="Jump to a task, resource or page..."
          className="w-full h-12 text-sm bg-transparent focus:outline-none placeholder:text-ink-tertiary text-ink font-medium"
        />
      </div>
      <Command.List ref={listRef} className="flex-1 min-h-0 overflow-y-auto py-2 relative z-10">
        <Command.Empty className="py-8 text-center text-body text-ink-tertiary">
          No results found.
        </Command.Empty>

        <Command.Group heading="Pages" className="cmdk-group">
          {user?.role !== 'admin' && (
            <>
              <PaletteItem onSelect={() => go('/')} icon={<LayoutDashboard size={15} />}>
                Dashboard
              </PaletteItem>
              <PaletteItem onSelect={() => go('/journey')} icon={<MapIcon size={15} />}>
                My journey
              </PaletteItem>
              <PaletteItem onSelect={() => go('/shortlisted')} icon={<Heart size={15} />}>
                Shortlisted
              </PaletteItem>
              <PaletteItem onSelect={() => go('/universities')} icon={<GraduationCap size={15} />}>
                Universities
              </PaletteItem>
              <PaletteItem onSelect={() => go('/profile')} icon={<CircleUser size={15} />}>
                My profile
              </PaletteItem>
              <PaletteItem onSelect={() => go('/settings')} icon={<SlidersHorizontal size={15} />}>
                Settings
              </PaletteItem>
            </>
          )}
          <PaletteItem onSelect={() => go('/resources')} icon={<BookOpen size={15} />}>
            Resources
          </PaletteItem>
          {user?.role === 'admin' && (
            <PaletteItem onSelect={() => go('/admin')} icon={<BarChart3 size={15} />}>
              Insights
            </PaletteItem>
          )}
        </Command.Group>

        {overview && (
          <Command.Group heading="Stages" className="cmdk-group">
            {overview.stages.map((s) => (
              <PaletteItem
                key={s.stage.id}
                onSelect={() => go(`/journey#stage-${s.stage.key}`)}
                icon={<MapIcon size={15} />}
              >
                {s.stage.title}
                <span className="ml-auto text-xs text-ink-muted relative z-20 font-semibold">
                  {s.done}/{s.total}
                </span>
              </PaletteItem>
            ))}
          </Command.Group>
        )}

        {overview && (
          <Command.Group heading="Tasks" className="cmdk-group">
            {overview.stages.flatMap((s) =>
              s.tasks.map((task) => (
                <PaletteItem
                  key={task.id}
                  onSelect={() => go(`/journey#task-${task.id}`)}
                  icon={
                    task.status === 'done' ? (
                      <CheckCircle2 size={15} className="text-positive" />
                    ) : (
                      <Circle size={15} className="text-ink-muted" />
                    )
                  }
                >
                  {task.title}
                </PaletteItem>
              )),
            )}
          </Command.Group>
        )}

        {uniqueResources.length > 0 && (
          <Command.Group heading="Resources" className="cmdk-group">
            {uniqueResources.map((resource) => (
              <PaletteItem
                key={resource.id}
                onSelect={() => go(`/resources?search=${encodeURIComponent(resource.title)}`)}
                icon={<BookOpen size={15} />}
              >
                {resource.title}
              </PaletteItem>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  )
}

function PaletteItem({
  children,
  icon,
  onSelect,
}: {
  children: ReactNode
  icon: ReactNode
  onSelect: () => void
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-4 h-9 text-body text-ink-secondary cursor-pointer transition-colors duration-[120ms] data-[selected=true]:text-ink relative z-20 font-medium"
    >
      {icon}
      {children}
    </Command.Item>
  )
}
