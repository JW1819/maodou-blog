const base = import.meta.env.VITE_API_BASE ?? ''

async function parseJson(res) {
  const text = await res.text()
  if (!text) return undefined
  return JSON.parse(text)
}

async function readErrorMessage(res) {
  const body = await res.text()
  if (!body) return res.statusText
  try {
    const j = JSON.parse(body)
    if (j && typeof j.message === 'string') return j.message
  } catch {
    /* ignore */
  }
  return body
}

function getHeaders(extra = {}) {
  const headers = {
    Accept: 'application/json',
    ...extra,
  }
  const token = localStorage.getItem('token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export async function apiGet(path) {
  const res = await fetch(`${base}${path}`, {
    headers: getHeaders(),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return parseJson(res)
}

export async function apiPost(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return parseJson(res)
}

export async function apiPatch(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'PATCH',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return parseJson(res)
}

export async function apiDelete(path) {
  const res = await fetch(`${base}${path}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return true
}
