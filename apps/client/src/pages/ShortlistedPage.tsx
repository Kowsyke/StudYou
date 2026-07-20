import type { University } from '@studyou/types'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  BookOpen,
  Building,
  Check,
  ExternalLink,
  GraduationCap,
  Heart,
  Home,
  Info,
  MapPin,
  Trash2,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { QueryError } from '../components/QueryError'
import { Button } from '../components/ui/button'
import { ProgressBar } from '../components/ui/progress'
import { CardSkeleton } from '../components/ui/skeleton'
import { useUniversities } from '../hooks/useUniversities'
import { formatGbpWhole } from '../lib/format'
import { cn } from '../lib/utils'
import { useProfileStore } from '../store/profileStore'
import {
  MILESTONE_KEYS,
  MILESTONE_LABELS,
  type UniProgress,
  getUniProgressPercent,
  useShortlistProgressStore,
} from '../store/shortlistProgressStore'
import { toast } from '../store/toastStore'

export function ShortlistedPage() {
  const shortlistIds = useProfileStore((s) => s.shortlistIds)
  const appliedIds = useProfileStore((s) => s.appliedIds)
  const removeFromShortlistId = useProfileStore((s) => s.removeFromShortlist)
  const toggleAppliedId = useProfileStore((s) => s.toggleApplied)

  const progress = useShortlistProgressStore((s) => s.progress)
  const toggleStep = useShortlistProgressStore((s) => s.toggleStep)

  // Fetch all universities using search filter defaults to filter locally
  const {
    data: allUniversities,
    isPending,
    error,
    refetch,
    isRefetching,
  } = useUniversities({
    search: '',
    regions: [],
    russellGroup: false,
    sort: 'name',
  })

  // Filter out shortlisted universities
  const shortlistedUnis = useMemo(() => {
    if (!allUniversities) return []
    return allUniversities.filter((u) => shortlistIds.includes(u.id))
  }, [allUniversities, shortlistIds])

  // Get synchronized progress map
  const synchronizedUnis = useMemo(() => {
    return shortlistedUnis.map((uni) => {
      const p = progress[uni.id] ?? {
        docsReady: false,
        applied: false,
        offer: false,
        deposit: false,
        visa: false,
        enrolled: false,
      }
      const isAppliedInProfile = appliedIds.includes(uni.id)

      // Auto-sync if out of step
      if (p.applied !== isAppliedInProfile) {
        p.applied = isAppliedInProfile
      }

      const percent = getUniProgressPercent(p)
      return { uni, progress: p, percent }
    })
  }, [shortlistedUnis, progress, appliedIds])

  // Aggregate Stats
  const totalUnis = shortlistedUnis.length
  const totalApplied = shortlistedUnis.filter((u) => appliedIds.includes(u.id)).length
  const avgProgress = useMemo(() => {
    if (synchronizedUnis.length === 0) return 0
    const sum = synchronizedUnis.reduce((acc, curr) => acc + curr.percent, 0)
    return Math.round(sum / synchronizedUnis.length)
  }, [synchronizedUnis])

  const handleToggleMilestone = (uniId: string, milestone: keyof UniProgress) => {
    toggleStep(uniId, milestone)

    // Sync to profileStore if toggling 'applied'
    if (milestone === 'applied') {
      toggleAppliedId(uniId)
    }

    const currentVal = !(progress[uniId]?.[milestone] ?? false)
    if (currentVal) {
      toast.success(`Updated milestone: ${MILESTONE_LABELS[milestone]}`)
    }
  }

  const handleRemove = (uni: University) => {
    removeFromShortlistId(uni.id)
    toast.success(`Removed ${uni.name} from shortlist`)
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <div className="h-8 w-48 bg-surface-secondary animate-pulse rounded-md" />
          <div className="h-4 w-96 bg-surface-secondary animate-pulse rounded-md" />
        </header>
        <div className="grid grid-cols-1 gap-4">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <QueryError
        message="Failed to load shortlisted universities. Please verify your connection."
        onRetry={() => refetch()}
        retrying={isRefetching}
      />
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-lg bg-surface border border-hairline shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-title3 text-ink">Shortlisted Universities</h1>
            <span className="bg-accent-soft text-accent text-micro font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Heart size={10} className="fill-current" />
              My Targets
            </span>
          </div>
          <p className="text-xs text-ink-secondary">
            Track and compare application progress, fees, and requirements for your desired
            universities.
          </p>
        </div>

        {totalUnis > 0 && (
          <div className="flex flex-wrap items-center gap-3 shrink-0 bg-surface-secondary/40 p-3 rounded-md border border-hairline">
            <div className="text-center px-3 border-r border-hairline">
              <span className="block text-title3 font-bold text-ink">{totalUnis}</span>
              <span className="text-[10px] text-ink-secondary uppercase tracking-wider">
                Shortlisted
              </span>
            </div>
            <div className="text-center px-3 border-r border-hairline">
              <span className="block text-title3 font-bold text-ink">{totalApplied}</span>
              <span className="text-[10px] text-ink-secondary uppercase tracking-wider">
                Applied
              </span>
            </div>
            <div className="text-center px-3">
              <span className="block text-title3 font-bold text-accent">{avgProgress}%</span>
              <span className="text-[10px] text-ink-secondary uppercase tracking-wider">
                Avg Progress
              </span>
            </div>
          </div>
        )}
      </header>

      {totalUnis === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No universities shortlisted yet"
          body="Browse the University Finder, find your target UK universities, and click 'Shortlist' to track them here."
          action={
            <Link to="/universities">
              <Button className="flex items-center gap-1.5">
                Go to Universities
                <ArrowUpRight size={14} />
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-2 px-1 text-xs text-ink-secondary bg-surface p-3 rounded-md border border-hairline shadow-2xs">
            <Info size={14} className="text-accent shrink-0" />
            <p>
              Use the steppers below to update your application progress per university. Changes
              sync with your profile settings.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {synchronizedUnis.map(({ uni, progress: uniProg, percent }) => (
              <motion.div
                key={uni.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="glass-reflect bg-surface border border-hairline rounded-lg shadow-sm overflow-hidden"
              >
                {/* University Info Block */}
                <div className="p-5 border-b border-hairline flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-secondary/20">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-body-lg font-bold text-ink leading-tight">{uni.name}</h2>
                      {uni.russellGroup && (
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs">
                          Russell Group
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-caption text-ink-secondary font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-ink-tertiary" />
                        {uni.city}, {uni.region}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building size={13} className="text-ink-tertiary" />
                        UK Rank: #{uni.rank}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                    <button
                      onClick={() => handleRemove(uni)}
                      aria-label={`Remove ${uni.name} from shortlist`}
                      className="p-2 text-ink-tertiary hover:text-danger hover:bg-danger-soft rounded-sm transition-colors duration-150"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Tuition Cost Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-secondary/30 p-3.5 rounded-md border border-hairline">
                    <div>
                      <span className="text-[10px] text-ink-tertiary font-semibold uppercase tracking-wider block mb-1">
                        Indicative International Tuition
                      </span>
                      <span className="text-body font-bold text-positive tabular-nums">
                        {uni.tuitionIntlMinGbp && uni.tuitionIntlMaxGbp
                          ? `${formatGbpWhole(uni.tuitionIntlMinGbp)} – ${formatGbpWhole(
                              uni.tuitionIntlMaxGbp,
                            )}`
                          : 'Check website'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-tertiary font-semibold uppercase tracking-wider block mb-1">
                        Indicative Home Tuition
                      </span>
                      <span className="text-body font-semibold text-ink-secondary tabular-nums">
                        {uni.tuitionHomeGbp ? formatGbpWhole(uni.tuitionHomeGbp) : 'Check website'}
                      </span>
                    </div>
                  </div>

                  {/* Application Stepper Progress */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-ink-secondary">Application Tracker</span>
                      <span className="font-bold text-accent tabular-nums">
                        {percent}% Complete
                      </span>
                    </div>
                    <ProgressBar value={percent} className="h-1.5" />

                    {/* Step Tracker UI */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-2">
                      {MILESTONE_KEYS.map((key, idx) => {
                        const isDone = uniProg[key]
                        return (
                          <button
                            key={key}
                            onClick={() => handleToggleMilestone(uni.id, key)}
                            className={cn(
                              'flex flex-col items-center justify-center p-2.5 rounded-md border text-center transition-all duration-150 select-none group',
                              isDone
                                ? 'bg-accent-soft border-accent/40 text-accent'
                                : 'bg-surface border-hairline-strong text-ink-secondary hover:bg-surface-secondary hover:border-hairline-strong',
                            )}
                          >
                            <span
                              className={cn(
                                'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-all',
                                isDone
                                  ? 'bg-accent text-white'
                                  : 'bg-surface-secondary text-ink-tertiary border border-hairline group-hover:bg-hairline',
                              )}
                            >
                              {isDone ? <Check size={10} strokeWidth={3} /> : idx + 1}
                            </span>
                            <span className="text-[10px] font-bold tracking-tight block truncate w-full">
                              {MILESTONE_LABELS[key]}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Quick Action Links */}
                  <div className="border-t border-hairline pt-4 flex flex-wrap gap-2 text-xs">
                    <a
                      href={uni.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface border border-hairline rounded-sm hover:bg-surface-secondary text-ink-secondary transition-colors"
                    >
                      <Building size={12} />
                      Website
                      <ExternalLink size={10} className="text-ink-tertiary" />
                    </a>
                    <a
                      href={uni.internationalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface border border-hairline rounded-sm hover:bg-surface-secondary text-ink-secondary transition-colors"
                    >
                      <GraduationCap size={12} />
                      International Office
                      <ExternalLink size={10} className="text-ink-tertiary" />
                    </a>
                    <a
                      href={uni.ugAdmissionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent-soft text-accent border border-accent/20 rounded-sm hover:bg-accent-soft/80 font-medium transition-colors"
                    >
                      Apply Now
                      <ArrowUpRight size={11} />
                    </a>
                    {uni.scholarshipsUrl && (
                      <a
                        href={uni.scholarshipsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface border border-hairline rounded-sm hover:bg-surface-secondary text-ink-secondary transition-colors"
                      >
                        <BookOpen size={12} />
                        Scholarships
                        <ExternalLink size={10} className="text-ink-tertiary" />
                      </a>
                    )}
                    {uni.accommodationUrl && (
                      <a
                        href={uni.accommodationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface border border-hairline rounded-sm hover:bg-surface-secondary text-ink-secondary transition-colors"
                      >
                        <Home size={12} />
                        Accommodation
                        <ExternalLink size={10} className="text-ink-tertiary" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
