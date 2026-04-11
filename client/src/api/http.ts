const base = import.meta.env.VITE_API_BASE ?? ''

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${base}${path}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || res.statusText)
  }
  return parseJson<T>(res)
}
