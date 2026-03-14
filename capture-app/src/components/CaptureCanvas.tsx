import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { CanvasMeta, Stroke } from '../types'

const CAP_HEIGHT_FRAC = 0.15
const BASELINE_FRAC   = 0.75
const MIN_STROKE_PX   = 2
const MAX_STROKE_PX   = 4

export type Mode = 'capture' | 'preview' | 'post-preview'

export interface CaptureCanvasHandle {
  playCapture: (strokes: Stroke[][], sourceMeta: CanvasMeta) => void
  clear:       () => void
  preview:     () => void
  accept:      () => void
  discard:     () => void
  hasStrokes:  () => boolean
}

interface Props {
  onCapture:      (strokes: Stroke[][], canvasMeta: CanvasMeta) => void
  onModeChange?:  (mode: Mode) => void
  disabled?:      boolean
  referenceStrokes?: Stroke[][] | null
  referenceMeta?:    CanvasMeta | null
}

export const CaptureCanvas = forwardRef<CaptureCanvasHandle, Props>(function CaptureCanvas(
  { onCapture, onModeChange, disabled = false, referenceStrokes, referenceMeta },
  ref,
) {
  const canvasEl    = useRef<HTMLCanvasElement>(null)
  const strokesRef  = useRef<Stroke[][]>([])
  const currentRef  = useRef<Stroke[]>([])
  const isDrawing   = useRef(false)
  const sessionStart= useRef(0)
  const rafRef      = useRef<number | null>(null)
  const modeRef     = useRef<Mode>('capture')

  // Keep reference data in refs so drawing functions (used in effects) always see current values
  const refStrokesRef = useRef<Stroke[][] | null>(null)
  const refMetaRef    = useRef<CanvasMeta | null>(null)
  refStrokesRef.current = referenceStrokes ?? null
  refMetaRef.current    = referenceMeta    ?? null

  const [mode, setMode] = useState<Mode>('capture')
  modeRef.current = mode

  function setModeAndNotify(m: Mode) {
    setMode(m)
    onModeChange?.(m)
  }

  // ── Canvas geometry ──────────────────────────────────────────────────────
  function logicalW(canvas: HTMLCanvasElement) { return canvas.width  / window.devicePixelRatio }
  function logicalH(canvas: HTMLCanvasElement) { return canvas.height / window.devicePixelRatio }
  function capHeightPx(canvas: HTMLCanvasElement) { return logicalH(canvas) * CAP_HEIGHT_FRAC }
  function baselinePx (canvas: HTMLCanvasElement) { return logicalH(canvas) * BASELINE_FRAC }

  // ── Ghost reference layer ────────────────────────────────────────────────
  function drawGhost(canvas: HTMLCanvasElement) {
    const refStrokes = refStrokesRef.current
    const refMeta    = refMetaRef.current
    if(!refStrokes || !refMeta || refStrokes.length === 0) return

    const curCapH = capHeightPx(canvas)
    const curBase = baselinePx(canvas)
    const yScale  = (curBase - curCapH) / (refMeta.baselineY - refMeta.capHeightY)

    // Find x bounding box so we can center the ghost horizontally
    let minX = Infinity, maxX = -Infinity
    for(const stroke of refStrokes)
      for(const pt of stroke) {
        if(pt.x < minX) minX = pt.x
        if(pt.x > maxX) maxX = pt.x
      }
    if(!isFinite(minX)) return

    const scaledW = (maxX - minX) * yScale
    const xOff    = (logicalW(canvas) - scaledW) / 2 - minX * yScale

    function tx(x: number) { return x * yScale + xOff }
    function ty(y: number) { return curCapH + (y - refMeta!.capHeightY) * yScale }

    const ctx = canvas.getContext('2d')!
    ctx.save()
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.strokeStyle = '#d4d4d4'
    ctx.lineWidth   = 1.5
    ctx.setLineDash([])
    for(const stroke of refStrokes) {
      if(stroke.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(tx(stroke[0]!.x), ty(stroke[0]!.y))
      for(let i = 1; i < stroke.length; i++)
        ctx.lineTo(tx(stroke[i]!.x), ty(stroke[i]!.y))
      ctx.stroke()
    }
    ctx.restore()
  }

  // ── Guide lines ──────────────────────────────────────────────────────────
  function drawGuides(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!
    const w   = logicalW(canvas)
    const h   = logicalH(canvas)
    ctx.clearRect(0, 0, w, h)

    drawGhost(canvas)

    // Cap-height: very faint dashed line
    ctx.strokeStyle = '#ebebeb'
    ctx.lineWidth   = 1
    ctx.setLineDash([4, 6])
    ctx.beginPath()
    ctx.moveTo(0, capHeightPx(canvas))
    ctx.lineTo(w, capHeightPx(canvas))
    ctx.stroke()

    // Baseline: solid, slightly more visible — the main writing guide
    ctx.strokeStyle = '#d0d0d0'
    ctx.lineWidth   = 1
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(0, baselinePx(canvas))
    ctx.lineTo(w, baselinePx(canvas))
    ctx.stroke()
  }

  // ── Stroke drawing ───────────────────────────────────────────────────────
  function drawAt(canvas: HTMLCanvasElement, x1: number, y1: number, x2: number, y2: number, pressure: number) {
    const ctx = canvas.getContext('2d')!
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth   = MIN_STROKE_PX + pressure * (MAX_STROKE_PX - MIN_STROKE_PX)
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  function drawSegment(canvas: HTMLCanvasElement, prev: Stroke, curr: Stroke) {
    drawAt(canvas, prev.x, prev.y, curr.x, curr.y, curr.p)
  }

  function redrawStrokes(canvas: HTMLCanvasElement) {
    for(const stroke of strokesRef.current)
      for(let i = 1; i < stroke.length; i++)
        drawSegment(canvas, stroke[i - 1]!, stroke[i]!)
  }

  // ── Canvas sizing ────────────────────────────────────────────────────────
  function sizeCanvas() {
    const canvas  = canvasEl.current
    if(!canvas) return
    const wrapper = canvas.parentElement
    if(!wrapper) return
    const size    = wrapper.clientWidth - 8
    canvas.width  = size * window.devicePixelRatio
    canvas.height = size * window.devicePixelRatio
    canvas.style.width  = size + 'px'
    canvas.style.height = size + 'px'
    const ctx = canvas.getContext('2d')!
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    drawGuides(canvas)
    redrawStrokes(canvas)
  }

  // ── Preview animation ────────────────────────────────────────────────────
  function runPreview(strokes: Stroke[][], onDone: () => void, sourceMeta?: CanvasMeta) {
    const canvas    = canvasEl.current
    if(!canvas) return
    const allPoints = strokes.flatMap(s => s)
    if(allPoints.length === 0) { onDone(); return }

    drawGuides(canvas)

    if(rafRef.current !== null) cancelAnimationFrame(rafRef.current)

    // Build coordinate transform: scale+center stored strokes onto the current canvas,
    // using the same math as drawGhost so replayed strokes land exactly on the ghost.
    let tx: (x: number) => number = x => x
    let ty: (y: number) => number = y => y
    if(sourceMeta) {
      const curCapH = capHeightPx(canvas)
      const curBase = baselinePx(canvas)
      const yScale  = (curBase - curCapH) / (sourceMeta.baselineY - sourceMeta.capHeightY)
      const minX    = allPoints.length > 0 ? Math.min(...allPoints.map(p => p.x)) : 0
      const maxX    = allPoints.length > 0 ? Math.max(...allPoints.map(p => p.x)) : 0
      const scaledW = (maxX - minX) * yScale
      const xOff    = (logicalW(canvas) - scaledW) / 2 - minX * yScale
      tx = x => x * yScale + xOff
      ty = y => curCapH + (y - sourceMeta.capHeightY) * yScale
    }

    let strokeIdx = 0
    let pointIdx  = 0
    const tOffset   = allPoints[0]!.t
    const startTime = performance.now()

    function step(now: number) {
      const elapsed = now - startTime
      while(true) {
        if(strokeIdx >= strokes.length) { onDone(); return }
        const stroke = strokes[strokeIdx]!
        if(pointIdx >= stroke.length) { strokeIdx++; pointIdx = 0; continue }
        const pt = stroke[pointIdx]!
        if(pt.t - tOffset > elapsed) break
        if(pointIdx > 0) {
          const prev = stroke[pointIdx - 1]!
          drawAt(canvas!, tx(prev.x), ty(prev.y), tx(pt.x), ty(pt.y), pt.p)
        }
        pointIdx++
      }
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
  }

  // ── Imperative handle ────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    playCapture(strokes: Stroke[][], sourceMeta: CanvasMeta) {
      if(rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      runPreview(strokes, () => {}, sourceMeta)
    },
    clear() {
      if(rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      strokesRef.current = []
      currentRef.current = []
      setModeAndNotify('capture')
      if(canvasEl.current) drawGuides(canvasEl.current)
    },
    preview() {
      if(strokesRef.current.length === 0) return
      if(rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      setModeAndNotify('preview')
      runPreview(strokesRef.current, () => setModeAndNotify('post-preview'))
    },
    accept() {
      const canvas = canvasEl.current
      if(!canvas || strokesRef.current.length === 0) return
      onCapture(strokesRef.current, {
        frameWidth:  logicalW(canvas),
        frameHeight: logicalH(canvas),
        capHeightY:  capHeightPx(canvas),
        baselineY:   baselinePx(canvas),
      })
    },
    discard() {
      if(rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      strokesRef.current = []
      currentRef.current = []
      setModeAndNotify('capture')
      if(canvasEl.current) drawGuides(canvasEl.current)
    },
    hasStrokes() {
      return strokesRef.current.length > 0
    },
  }))

  // ── Pointer events ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasEl.current
    if(!canvas) return

    function onPointerDown(e: PointerEvent) {
      if(modeRef.current !== 'capture') return
      e.preventDefault()
      canvas!.setPointerCapture(e.pointerId)
      if(strokesRef.current.length === 0) sessionStart.current = e.timeStamp
      isDrawing.current  = true
      currentRef.current = []
      recordPoint(e)
    }

    function onPointerMove(e: PointerEvent) {
      if(!isDrawing.current || modeRef.current !== 'capture') return
      e.preventDefault()
      const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]
      for(const ev of events) recordPoint(ev)
    }

    function onPointerUp(e: PointerEvent) {
      if(!isDrawing.current) return
      e.preventDefault()
      isDrawing.current = false
      if(currentRef.current.length > 0) {
        strokesRef.current = [...strokesRef.current, currentRef.current]
        currentRef.current = []
      }
    }

    function onPointerCancel() {
      isDrawing.current  = false
      currentRef.current = []
    }

    function recordPoint(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect()
      const x    = e.clientX - rect.left
      const y    = e.clientY - rect.top
      const t    = Math.round(e.timeStamp - sessionStart.current)
      const p    = e.pressure || 0.5
      const pt   = { x, y, t, p }
      currentRef.current = [...currentRef.current, pt]
      if(currentRef.current.length >= 2)
        drawSegment(canvas!, currentRef.current[currentRef.current.length - 2]!, pt)
    }

    canvas.addEventListener('pointerdown',   onPointerDown)
    canvas.addEventListener('pointermove',   onPointerMove)
    canvas.addEventListener('pointerup',     onPointerUp)
    canvas.addEventListener('pointercancel', onPointerCancel)
    return () => {
      canvas.removeEventListener('pointerdown',   onPointerDown)
      canvas.removeEventListener('pointermove',   onPointerMove)
      canvas.removeEventListener('pointerup',     onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerCancel)
    }
  }, [])

  // ── Sizing ───────────────────────────────────────────────────────────────
  useEffect(() => {
    sizeCanvas()
    window.addEventListener('resize', sizeCanvas)
    return () => window.removeEventListener('resize', sizeCanvas)
  }, [])

  // ── Redraw when reference capture arrives or changes ─────────────────────
  useEffect(() => {
    const canvas = canvasEl.current
    if(!canvas || modeRef.current !== 'capture') return
    drawGuides(canvas)
    redrawStrokes(canvas)
  }, [referenceStrokes, referenceMeta])

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => { if(rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [])

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="canvas-wrapper">
      <canvas ref={canvasEl} className="capture-canvas" />
    </div>
  )
})
