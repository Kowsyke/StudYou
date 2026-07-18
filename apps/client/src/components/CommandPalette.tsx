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
import { type ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface CommandPaletteProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function CommandPalette({ open, setOpen }: CommandPaletteProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

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

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global search"
      contentClassName="glass-reflect palette-in fixed top-[18vh] left-1/2 -translate-x-1/2 w-[min(480px,90vw)] z-50 bg-surface rounded-lg border border-hairline-strong shadow-overlay overflow-hidden"
      overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-40"
    >
      <div className="flex items-center gap-3 px-4 border-b border-hairline">
        <SearchIcon size={16} className="text-ink-tertiary shrink-0" />
        <Command.Input
          placeholder="Jump to a task, resource or page..."
          className="w-full h-12 text-sm bg-transparent focus:outline-none placeholder:text-ink-tertiary text-ink"
        />
      </div>
      <Command.List className="max-h-[50vh] overflow-y-auto py-2">
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
                <span className="ml-auto text-xs text-ink-muted">
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
      className="flex items-center gap-3 px-4 h-9 text-body text-ink-secondary cursor-pointer transition-colors duration-[120ms] data-[selected=true]:bg-surface-secondary data-[selected=true]:text-ink"
    >
      {icon}
      {children}
    </Command.Item>
  )
}
