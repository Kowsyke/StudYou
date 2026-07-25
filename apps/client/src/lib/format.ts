export function formatGbp(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100)
}

export function formatHome(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function daysLeftLabel(daysLeft: number): string {
  if (daysLeft < 0) return `${Math.abs(daysLeft)} days overdue`
  if (daysLeft === 0) return 'Due today'
  if (daysLeft === 1) return 'Due tomorrow'
  return `${daysLeft} days left`
}

/*
  Returns a URL only if it is a plain http or https link, otherwise undefined.
  Defense in depth for links that come from the database (resource and
  university source URLs): the server now rejects other schemes on write, but
  a javascript: or data: URL that predates that check, or arrives via seed
  data, must never become a live href. Passing undefined to an anchor's href
  renders a non-navigable link rather than an executable one.
*/
export function safeExternalUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  try {
    const { protocol } = new URL(url)
    return protocol === 'http:' || protocol === 'https:' ? url : undefined
  } catch {
    return undefined
  }
}

/* Whole pound amounts (tuition figures arrive as GBP integers). */
export function formatGbpWhole(gbp: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(gbp)
}
