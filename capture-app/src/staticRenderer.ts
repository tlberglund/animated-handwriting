import type { GlyphDetail, GlyphCapture, CanvasMeta, Stroke, CaptureAdjustment } from './types'

export interface StaticRenderOptions {
   capHeight?:  number   // CSS px, default 80
   topPad?:     number   // CSS px, default 12
   letterGap?:  number   // cap-height units, default 0.05
   wordGap?:    number   // cap-height units, default 0.35
   color?:      string   // default '#1a1a1a'
   minWidth?:   number   // px, default 2
   maxWidth?:   number   // px, default 4
   scale?:      number   // pixel density, default window.devicePixelRatio
}

interface NormalizedStroke {
   x: number
   y: number
   p: number
}

// Normalize raw captured strokes to cap-height coordinate space,
// then apply adjustment (baseline-anchored isotropic scale + y offset).
function normalizeCapture(
   capture: GlyphCapture,
   adj: CaptureAdjustment,
): { strokes: NormalizedStroke[][], width: number } {
   const meta: CanvasMeta = capture.canvasMeta
   const vertScale = 1.0 / (meta.baselineY - meta.capHeightY)
   const allPoints = capture.strokes.flat()
   if(allPoints.length === 0) return { strokes: [], width: 0 }

   const minX    = Math.min(...allPoints.map(p => p.x))
   const maxX    = Math.max(...allPoints.map(p => p.x))
   const rawW    = (maxX - minX) * vertScale
   const s       = adj.scale
   const yo      = adj.yOffset

   const strokes = capture.strokes.map(stroke =>
      stroke.map((pt: Stroke) => {
         const nx = (pt.x - minX) * vertScale
         const ny = (pt.y - meta.capHeightY) * vertScale
         return {
            x: nx * s,
            y: 1.0 - (1.0 - ny) * s + yo,
            p: pt.p,
         }
      })
   )

   return { strokes, width: rawW * s }
}

function pickCapture(
   detail: GlyphDetail,
   pinnedCaptureId: string | null,
   lastUsed: Map<string, string>,
): GlyphCapture | null {
   const captures = detail.captures
   if(captures.length === 0) return null

   if(pinnedCaptureId !== null) {
      return captures.find(c => c.id === pinnedCaptureId) ?? captures[0]!
   }

   // random, avoiding repeat
   const lastId     = lastUsed.get(detail.character)
   const candidates = lastId ? captures.filter(c => c.id !== lastId) : captures
   const pool       = candidates.length > 0 ? candidates : captures
   const chosen     = pool[Math.floor(Math.random() * pool.length)]!
   lastUsed.set(detail.character, chosen.id)
   return chosen
}

const NEUTRAL_ADJ: CaptureAdjustment = { scale: 1.0, yOffset: 0.0 }

export function staticRender(
   canvas: HTMLCanvasElement,
   glyphs: Record<string, GlyphDetail>,
   phrase: string,
   pinnedCaptureId: string | null,
   provisionalAdjustment: CaptureAdjustment,
   opts: StaticRenderOptions = {},
): void {
   const capHeight = opts.capHeight  ?? 80
   const topPad    = opts.topPad     ?? 12
   const letterGap = opts.letterGap  ?? 0.05
   const wordGap   = opts.wordGap    ?? 0.35
   const color     = opts.color      ?? '#1a1a1a'
   const minWidth  = opts.minWidth   ?? 2
   const maxWidth  = opts.maxWidth   ?? 4
   const dpr       = opts.scale      ?? window.devicePixelRatio ?? 1

   const cssW = canvas.clientWidth  || canvas.width
   const cssH = canvas.clientHeight || canvas.height
   canvas.width  = cssW * dpr
   canvas.height = cssH * dpr

   const ctx = canvas.getContext('2d')
   if(!ctx) return

   ctx.scale(dpr, dpr)
   ctx.clearRect(0, 0, cssW, cssH)
   ctx.lineCap  = 'round'
   ctx.lineJoin = 'round'
   ctx.strokeStyle = color

   // Identify which character owns the pinned capture (if any)
   let pinnedChar: string | null = null
   if(pinnedCaptureId !== null) {
      for(const [char, detail] of Object.entries(glyphs)) {
         if(detail.captures.some(c => c.id === pinnedCaptureId)) {
            pinnedChar = char
            break
         }
      }
   }

   const lastUsed = new Map<string, string>()
   let xOffset = 0

   for(const token of phrase) {
      if(token === ' ') {
         xOffset += wordGap
         continue
      }

      const detail = glyphs[token]
      if(!detail) continue

      const isPinned = token === pinnedChar
      const chosen   = pickCapture(detail, isPinned ? pinnedCaptureId : null, lastUsed)
      if(!chosen) continue

      const adj        = isPinned ? provisionalAdjustment : NEUTRAL_ADJ
      const { strokes, width } = normalizeCapture(chosen, adj)
      const xOrigin    = xOffset * capHeight

      for(const stroke of strokes) {
         for(let i = 1; i < stroke.length; i++) {
            const prev = stroke[i - 1]!
            const curr = stroke[i]!
            const lw   = minWidth + curr.p * (maxWidth - minWidth)
            ctx.lineWidth = lw
            ctx.beginPath()
            ctx.moveTo(xOrigin + prev.x * capHeight, topPad + prev.y * capHeight)
            ctx.lineTo(xOrigin + curr.x * capHeight, topPad + curr.y * capHeight)
            ctx.stroke()
         }
      }

      xOffset += width + letterGap
   }
}
