import { app } from '../apps/server/src/index'

export default async function handler(req: any, res: any) {
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost'
  const url = `${protocol}://${host}${req.url}`

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v)
      } else {
        headers.set(key, value as string)
      }
    }
  }

  const options: RequestInit = { method: req.method, headers }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks: Uint8Array[] = []
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    options.body = Buffer.concat(chunks)
  }

  const request = new Request(url, options)
  const response = await app.fetch(request)

  res.statusCode = response.status
  response.headers.forEach((v, k) => res.setHeader(k, v))
  const body = await response.arrayBuffer()
  res.end(Buffer.from(body))
}
