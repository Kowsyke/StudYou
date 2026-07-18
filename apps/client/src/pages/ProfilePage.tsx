import type { University } from '@studyou/types'
import { BookmarkX, Check, ExternalLink, GraduationCap, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardKicker } from '../components/ui/card'
import { useUniversities } from '../hooks/useUniversities'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { AVATAR_HUES, avatarGradients, initialsOf, useProfileStore } from '../store/profileStore'
import { toast } from '../store/toastStore'

const defaultFilters = { search: '', regions: [], russellGroup: false, sort: 'rank' as const }

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const avatarHue = useProfileStore((s) => s.avatarHue)
  const setAvatarHue = useProfileStore((s) => s.setAvatarHue)
  const shortlistIds = useProfileStore((s) => s.shortlistIds)
  const appliedIds = useProfileStore((s) => s.appliedIds)
  const toggleApplied = useProfileStore((s) => s.toggleApplied)
  const removeFromShortlist = useProfileStore((s) => s.removeFromShortlist)
  const { data: universities } = useUniversities(defaultFilters)

  const shortlisted = (universities ?? []).filter((u) => shortlistIds.includes(u.id))
  const applied = shortlisted.filter((u) => appliedIds.includes(u.id))

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-title3 text-ink">Your profile</h1>
        <p className="text-xs text-ink-secondary mt-1">
          Your account, your avatar, and every university you are tracking.
        </p>
      </header>

      <Card className="mb-5">
        <CardContent className="flex flex-wrap items-center gap-5 py-5">
          <span
            className="h-16 w-16 rounded-lg text-white text-title3 font-extrabold flex items-center justify-center shadow-md breathe"
            style={{ backgroundImage: avatarGradients[avatarHue] }}
            aria-hidden="true"
          >
            {initialsOf(user?.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-body-lg font-bold text-ink truncate">{user?.fullName}</p>
            <p className="text-body text-ink-secondary truncate">{user?.email}</p>
            <p className="text-caption text-ink-tertiary capitalize mt-0.5">{user?.role} account</p>
          </div>
          <div>
            <p className="text-caption font-semibold uppercase tracking-[0.05em] text-ink-secondary mb-2">
              Avatar colour
            </p>
            <fieldset className="flex gap-2 border-0" aria-label="Choose your avatar colour">
              {AVATAR_HUES.map((hue) => (
                <button
                  key={hue}
                  onClick={() => {
                    setAvatarHue(hue)
                    toast.success('Avatar updated.')
                  }}
                  aria-pressed={avatarHue === hue}
                  aria-label={`Avatar colour ${hue}`}
                  className={cn(
                    'h-7 w-7 rounded-full transition-transform duration-[120ms] hover:scale-110',
                    avatarHue === hue &&
                      '[box-shadow:0_0_0_2px_var(--surface),0_0_0_4px_var(--accent)]',
                  )}
                  style={{ backgroundImage: avatarGradients[hue] }}
                />
              ))}
            </fieldset>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatChip value={shortlisted.length} label="Shortlisted" />
        <StatChip value={applied.length} label="Applied" />
        <StatChip value={shortlisted.length - applied.length} label="Still to apply" />
        <StatChip value={new Set(shortlisted.map((u) => u.region)).size} label="Regions covered" />
      </div>

      <Card className="mb-5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardKicker>Shortlisted universities</CardKicker>
          <Link to="/universities" className="text-xs font-medium text-accent hover:underline">
            Find more
          </Link>
        </CardHeader>
        <CardContent>
          {shortlisted.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Nothing shortlisted yet"
              body="Browse or swipe through 200 UK universities and the ones you shortlist will live here."
              action={
                <Link to="/universities">
                  <Button>Find your university</Button>
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {shortlisted.map((u) => (
                <ShortlistRow
                  key={u.id}
                  university={u}
                  applied={appliedIds.includes(u.id)}
                  onToggleApplied={() => toggleApplied(u.id)}
                  onRemove={() => {
                    removeFromShortlist(u.id)
                    toast.success(`${u.name} removed.`)
                  }}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatChip({ value, label }: { value: number; label: string }) {
  return (
    <Card className="p-4">
      <p className="text-title3 text-ink tabular-nums">{value}</p>
      <p className="text-caption text-ink-secondary mt-0.5">{label}</p>
    </Card>
  )
}

function ShortlistRow({
  university: u,
  applied,
  onToggleApplied,
  onRemove,
}: {
  university: University
  applied: boolean
  onToggleApplied: () => void
  onRemove: () => void
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-3.5 py-3 rounded-md bg-canvas border border-hairline">
      <span className="text-caption font-bold text-accent bg-accent-soft rounded-xs px-1.5 py-0.5 tabular-nums">
        #{u.rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-ink truncate">{u.name}</p>
        <p className="text-caption text-ink-tertiary">
          {u.city}, {u.region}
        </p>
      </div>
      <a
        href={u.ugAdmissionsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline rounded-xs"
      >
        Apply page
        <ExternalLink size={10} />
      </a>
      <button
        onClick={onToggleApplied}
        aria-pressed={applied}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors duration-[120ms]',
          applied
            ? 'bg-positive-soft border-positive text-positive'
            : 'bg-surface border-hairline-strong text-ink-secondary hover:bg-surface-secondary hover:text-ink',
        )}
      >
        {applied ? <Check size={12} /> : <Send size={12} />}
        {applied ? 'Applied' : 'Mark applied'}
      </button>
      <button
        onClick={onRemove}
        aria-label={`Remove ${u.name} from shortlist`}
        className="h-7 w-7 flex items-center justify-center rounded-xs border border-hairline text-ink-tertiary hover:bg-danger-soft hover:text-danger hover:border-danger transition-colors duration-[120ms]"
      >
        <BookmarkX size={13} />
      </button>
    </li>
  )
}
