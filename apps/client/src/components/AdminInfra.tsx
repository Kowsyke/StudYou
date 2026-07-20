import { useQuery } from '@tanstack/react-query'
import { Activity, Clock, Database, ExternalLink, Gauge, Server, Wifi } from 'lucide-react'
import { CardContent, CardDescription, CardHeader, CardKicker, CardTitle } from './ui/card'

const AZURE_APP = 'studyou-app-7097'
const AZURE_DB = 'studyou-db-22637'
const LIVE_URL = 'https://studyou-app-7097.azurewebsites.net'

interface HealthResult {
  ok: boolean
  status: number
  latencyMs: number
  serverTime: string | null
}

// Genuine liveness: times a real request to the API health endpoint. No
// fabricated CPU or memory gauges; anything that cannot be measured
// honestly from the browser is a link out to the Azure portal instead.
async function pingHealth(): Promise<HealthResult> {
  const started = performance.now()
  try {
    const res = await fetch('/health', { cache: 'no-store' })
    const latencyMs = Math.round(performance.now() - started)
    let serverTime: string | null = null
    try {
      const body = (await res.json()) as { timestamp?: string }
      serverTime = body?.timestamp ?? null
    } catch {}
    return { ok: res.ok, status: res.status, latencyMs, serverTime }
  } catch {
    return {
      ok: false,
      status: 0,
      latencyMs: Math.round(performance.now() - started),
      serverTime: null,
    }
  }
}

// A latency reading is only meaningful in bands; call them plainly.
function latencyLabel(ms: number): string {
  if (ms < 150) return 'Fast'
  if (ms < 500) return 'Normal'
  return 'Slow'
}

export function InfrastructurePanel() {
  const {
    data: health,
    isPending,
    dataUpdatedAt,
    isFetching,
  } = useQuery({
    queryKey: ['api-health'],
    queryFn: pingHealth,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  })

  const up = health?.ok ?? false
  const lastChecked =
    dataUpdatedAt > 0 ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour12: false }) : null

  return (
    <div className="aurora-card rounded-lg shadow-md mb-8 print:hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <CardKicker>Infrastructure</CardKicker>
          <CardTitle className="text-body font-semibold">Deployment and health</CardTitle>
          <CardDescription>
            Live status measured from the API health endpoint every 15 seconds. Detailed compute and
            network metrics live in the Azure portal.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <a
            href={LIVE_URL}
            target="_blank"
            rel="noreferrer"
            className="h-8 px-3 text-caption font-semibold bg-surface hover:bg-surface-secondary text-ink border border-hairline-strong rounded-sm inline-flex items-center gap-1.5 shadow-sm transition-colors duration-100"
          >
            <ExternalLink size={12} />
            View live app
          </a>
          <a
            href="https://portal.azure.com"
            target="_blank"
            rel="noreferrer"
            className="sheen h-8 px-3 text-caption font-semibold bg-accent-solid text-white rounded-sm inline-flex items-center gap-1.5 shadow-md [background-image:var(--accent-gradient)] active:scale-[0.98] transition-all duration-100"
          >
            <Server size={12} />
            Azure portal
          </a>
        </div>
      </CardHeader>
      <CardContent>
        {/* Metric tiles reflow 2 up on phones, 4 up on wide screens, so
            nothing overflows or crowds as the window resizes. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricTile
            icon={<Wifi size={14} />}
            label="API status"
            value={isPending ? 'Checking' : up ? 'Online' : 'Down'}
            accent={up ? 'positive' : isPending ? 'muted' : 'danger'}
            dot={!isPending}
            dotUp={up}
          />
          <MetricTile
            icon={<Activity size={14} />}
            label="Latency"
            value={health ? `${health.latencyMs} ms` : 'n/a'}
            hint={health ? latencyLabel(health.latencyMs) : undefined}
          />
          <MetricTile
            icon={<Gauge size={14} />}
            label="Response code"
            value={health ? String(health.status || 'no reply') : 'n/a'}
          />
          <MetricTile
            icon={<Clock size={14} />}
            label="Last checked"
            value={lastChecked ?? 'n/a'}
            hint={isFetching ? 'refreshing' : 'auto every 15s'}
          />
        </div>

        {/* Honest, static facts about where and how this runs. Reflows from a
            single column up to three as space allows. */}
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 border-t border-hairline pt-4">
          <Fact icon={<Server size={13} />} label="Web app" value={AZURE_APP} />
          <Fact
            icon={<Database size={13} />}
            label="Database"
            value={`${AZURE_DB}, Sweden Central`}
          />
          <Fact icon={<Wifi size={13} />} label="Runtime" value="Bun + Hono on Azure App Service" />
          <Fact icon={<Gauge size={13} />} label="Frontend" value="React + Vite static build" />
          <Fact
            icon={<Server size={13} />}
            label="Deploys"
            value="GitHub Actions on push to main"
          />
          <Fact
            icon={<ExternalLink size={13} />}
            label="Live URL"
            value={LIVE_URL.replace('https://', '')}
          />
        </dl>
      </CardContent>
    </div>
  )
}

function MetricTile({
  icon,
  label,
  value,
  hint,
  accent = 'default',
  dot = false,
  dotUp = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  accent?: 'default' | 'positive' | 'danger' | 'muted'
  dot?: boolean
  dotUp?: boolean
}) {
  const valueColor =
    accent === 'positive'
      ? 'text-positive'
      : accent === 'danger'
        ? 'text-danger'
        : accent === 'muted'
          ? 'text-ink-tertiary'
          : 'text-ink'
  return (
    <div className="rounded-md bg-canvas border border-hairline p-3 flex flex-col gap-1.5 min-w-0">
      <p className="text-micro font-semibold uppercase tracking-[0.05em] text-ink-tertiary flex items-center gap-1.5">
        <span className="text-ink-tertiary shrink-0">{icon}</span>
        <span className="leading-tight">{label}</span>
      </p>
      <div className="flex items-center gap-2 min-w-0">
        {dot && (
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {dotUp && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 glow-pulse ${dotUp ? 'bg-positive' : 'bg-danger'}`}
            />
          </span>
        )}
        <span className={`text-lg font-bold leading-none tabular-nums truncate ${valueColor}`}>
          {value}
        </span>
      </div>
      {hint && <p className="text-micro text-ink-tertiary leading-none">{hint}</p>}
    </div>
  )
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className="mt-0.5 text-ink-tertiary shrink-0">{icon}</span>
      <div className="min-w-0">
        <dt className="text-micro font-semibold uppercase tracking-[0.05em] text-ink-tertiary">
          {label}
        </dt>
        <dd className="text-caption text-ink-secondary font-medium break-words">{value}</dd>
      </div>
    </div>
  )
}
