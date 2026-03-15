import type { CaptureSet, GlyphSummary, GlyphDetail, GlyphCapture, GlyphSet, Progress, Stroke, CanvasMeta } from './types'

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '') + '/api'

// encodeURIComponent leaves . ! ~ * ' ( ) unencoded. A bare '.' as a middle
// path segment gets normalized away by Ktor (RFC 3986 dot-segment removal), so
// double-encode it: '.' → '%252E'. Ktor decodes '%25' → '%', leaving '%2E' as
// the raw parameter value; the backend then decodes that final step.
const encodeChar = (c: string) =>
  encodeURIComponent(c)
    .replace(/\./g, '%252E')
    .replace(/[!~*'()]/g, ch => '%' + ch.charCodeAt(0).toString(16).toUpperCase())

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(await res.text())
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export const api = {
  listCaptureSets: () =>
    req<CaptureSet[]>('GET', '/capture-sets'),

  createCaptureSet: (name: string, description?: string) =>
    req<CaptureSet>('POST', '/capture-sets', { name, description }),

  listGlyphs: (setId: string) =>
    req<GlyphSummary[]>('GET', `/capture-sets/${setId}/glyphs`),

  getGlyph: (setId: string, char: string) =>
    req<GlyphDetail>('GET', `/capture-sets/${setId}/glyphs/${encodeChar(char)}`),

  getProgress: (setId: string) =>
    req<Progress>('GET', `/capture-sets/${setId}/progress`),

  createCapture: (setId: string, char: string, strokes: Stroke[][], canvasMeta: CanvasMeta) =>
    req<GlyphCapture>(
      'POST',
      `/capture-sets/${setId}/glyphs/${encodeChar(char)}/captures`,
      { strokes, canvasMeta },
    ),

  deleteCapture: (setId: string, char: string, captureId: string) =>
    req<void>(
      'DELETE',
      `/capture-sets/${setId}/glyphs/${encodeChar(char)}/captures/${captureId}`,
    ),

  setDefaultCapture: (setId: string, char: string, captureId: string) =>
    req<void>(
      'PUT',
      `/capture-sets/${setId}/glyphs/${encodeChar(char)}/default-capture`,
      { captureId },
    ),

  exportGlyphSet: (setId: string) =>
    req<GlyphSet>('GET', `/capture-sets/${setId}/export`),
}
