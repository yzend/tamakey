const LOCAL_SESSION_KEY = 'tamakey.localSession.v1'

export type LocalSession = {
  caretakerName: string
  createdAt: number
}

export function sanitizeDisplayName(value: string, fallback: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length === 0) return fallback

  return normalized.slice(0, 16)
}

export function loadLocalSession(): LocalSession | null {
  if (typeof localStorage === 'undefined') return null

  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<LocalSession>
    if (typeof parsed.caretakerName !== 'string') return null
    if (typeof parsed.createdAt !== 'number') return null

    return {
      caretakerName: sanitizeDisplayName(parsed.caretakerName, '本地照护者'),
      createdAt: parsed.createdAt,
    }
  } catch {
    return null
  }
}

export function saveLocalSession(caretakerName: string): LocalSession {
  const session = {
    caretakerName: sanitizeDisplayName(caretakerName, '本地照护者'),
    createdAt: Date.now(),
  }

  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session))
  return session
}

export function createTestKitSession(): LocalSession {
  return {
    caretakerName: '本地照护者',
    createdAt: Date.now(),
  }
}
