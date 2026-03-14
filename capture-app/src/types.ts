export interface Stroke {
  x: number
  y: number
  t: number
  p: number
}

export interface CanvasMeta {
  frameWidth: number
  frameHeight: number
  capHeightY: number
  baselineY: number
}

export interface CaptureSet {
  id: string
  name: string
  description: string | null
  createdAt: string
}

export interface GlyphSummary {
  id: string
  character: string
  glyphType: string
  captureCount: number
}

export interface GlyphCapture {
  id: string
  capturedAt: string
  strokes: Stroke[][]
  canvasMeta: CanvasMeta
  notes: string | null
}

export interface GlyphDetail {
  id: string
  character: string
  glyphType: string
  defaultCaptureId: string | null
  captures: GlyphCapture[]
}

export interface ExportPoint {
  x: number
  y: number
  t: number
  p: number
}

export interface ExportCapture {
  id: string
  strokes: ExportPoint[][]
}

export interface ExportGlyph {
  character: string
  width: number
  captures: ExportCapture[]
}

export interface GlyphSet {
  version: number
  captureSetName: string
  glyphs: Record<string, ExportGlyph>
}

export interface ProgressByType {
  total: number
  captured: number
}

export interface Progress {
  total: number
  captured: number
  remaining: number
  nextUncaptured: string | null
  byType: Record<string, ProgressByType>
}
