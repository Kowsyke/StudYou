import { useQuery } from '@tanstack/react-query'
import { Activity, ExternalLink, Server } from 'lucide-react'
import { CardContent, CardDescription, CardHeader, CardKicker, CardTitle } from './ui/card'

const AZURE_APP = 'studyou-app-7097'
const AZURE_DB = 'studyou-db-22637'
const LIVE_URL = 'https://studyou-app-7097.azurewebsites.net'

interface HealthResult {
  ok: boolean
  status: number
  latencyMs: number
}

// Genuine liveness: times a real request to the API health endpoint. No
// fabricated CPU or memory gauges; anything that cannot be measured
// honestly from the browser is a link out to the Azure portal instead.
async function pingHealth(): Promise<HealthResult> {
  const started = performance.now()
  try {
    const res = await fetch('/health', { cache: 'no-store' })
    return { ok: res.ok, status: res.status, latencyMs: Math.round(performance.now() - started) }
  } catch {
    return { ok: false, status: 0, latencyMs: Math.round(performance.now() - started) }
  }
}

export function InfrastructurePanel() {
  const { data: health, isPending } = useQuery({
    queryKey: ['api-health'],
    queryFn: pingHealth,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  })

  const up = health?.ok ?? false

  return (
    <div className="aurora-card rounded-lg shadow-md mb-8 print:hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardKicker>Infrastructure</CardKicker>
          <CardTitle className="text-body font-semibold">Deployment and health</CardTitle>
          <CardDescription>
            Live status from the API health endpoint. Detailed compute and network metrics live in
            the Azure portal.
          </CardDescription>
        </div>
        <div className="flex gap-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-md bg-canvas border border-hairline">
          <div className="space-y-1">
            <p className="text-micro font-semibold uppercase tracking-[0.05em] text-ink-tertiary">
              API status
            </p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {up && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${up ? 'bg-positive' : 'bg-danger'}`}
                />
              </span>
              <span className="text-[20px] font-bold text-ink leading-none">
                {isPending ? 'Checking' : up ? 'Online' : 'Down'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-micro font-semibold uppercase tracking-[0.05em] text-ink-tertiary">
              Health check latency
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-[20px] font-bold text-ink leading-none tabular-nums">
                {health ? `${health.latencyMs} ms` : '—'}
              </span>
              <Activity size={14} className="text-ink-tertiary" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-micro font-semibold uppercase tracking-[0.05em] text-ink-tertiary">
              Response code
            </p>
            <span className="text-[20px] font-bold text-ink leading-none tabular-nums">
              {health ? health.status || 'no reply' : '—'}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-caption text-ink-tertiary border-t border-hairline pt-3.5">
          <span>
            Web app: <strong className="text-ink-secondary">{AZURE_APP}</strong>
          </span>
          <span>
            Database: <strong className="text-ink-secondary">{AZURE_DB} (Sweden Central)</strong>
          </span>
          <span>
            Deploys via <strong className="text-ink-secondary">GitHub Actions</strong> on push to
            main
          </span>
        </div>
      </CardContent>
    </div>
  )
}
