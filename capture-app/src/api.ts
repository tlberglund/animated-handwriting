import type { CaptureSet, GlyphSummary, GlyphDetail, GlyphCapture, GlyphSet, Progress, Stroke, CanvasMeta } from './types'

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '') + '/api'

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
    req<GlyphDetail>('GET', `/capture-sets/${setId}/glyphs/${encodeURIComponent(char)}`),

  getProgress: (setId: string) =>
    req<Progress>('GET', `/capture-sets/${setId}/progress`),

  createCapture: (setId: string, char: string, strokes: Stroke[][], canvasMeta: CanvasMeta) =>
    req<GlyphCapture>(
      'POST',
      `/capture-sets/${setId}/glyphs/${encodeURIComponent(char)}/captures`,
      { strokes, canvasMeta },
    ),

  deleteCapture: (setId: string, char: string, captureId: string) =>
    req<void>(
      'DELETE',
      `/capture-sets/${setId}/glyphs/${encodeURIComponent(char)}/captures/${captureId}`,
    ),

  exportGlyphSet: (setId: string) =>
    req<GlyphSet>('GET', `/capture-sets/${setId}/export`),
}
