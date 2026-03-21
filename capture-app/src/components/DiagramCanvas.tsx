import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { NormalizedStroke } from '../types'

const MIN_STROKE_PX = 1.5
const MAX_STROKE_PX = 3

export interface DiagramCanvasHandle {
  clear:        () => void
  redraw:       (strokes: NormalizedStroke[][]) => void
  replay:       (strokes: NormalizedStroke[][]) => void
}

interface Props {
  aspectRatio:    number  // width / height
  onStrokeAdded:  (stroke: NormalizedStroke[]) => void
}

export const DiagramCanvas = forwardRef<DiagramCanvasHandle, Props>(function DiagramCanvas(
  { aspectRatio, onStrokeAdded },
  ref,
) {
  const canvasEl         = useRef<HTMLCanvasElement>(null)
  const isDrawing        = useRef(false)
  const activePointerId  = useRef<number | null>(null)
  const currentRef       = useRef<NormalizedStroke[]>([])
  const sessionStart     = useRef(0)
  const allStrokes       = useRef<NormalizedStroke[][]>([])
  const replayRafRef     = useRef<number | null>(null)

  const REPLAY_SPEED = 1.5

  function cancelReplay() {
    if(replayRafRef.current !== null) {
      cancelAnimationFrame(replayRafRef.current)
      replayRafRef.current = null
    }
  }

  // ── Canvas geometry ────────────────────────────────────────────────────────

  function logicalW(canvas: HTMLCanvasElement) { return canvas.width  / window.devicePixelRatio }
  function logicalH(canvas: HTMLCanvasElement) { return canvas.height / window.devicePixelRatio }

  // ── Drawing ────────────────────────────────────────────────────────────────

  function drawSegment(
    canvas: HTMLCanvasElement,
    x1: number, y1: number,
    x2: number, y2: number,
    pressure: number,
  ) {
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

  function replayStrokes(canvas: HTMLCanvasElement, strokes: NormalizedStroke[][]) {
    const w = logicalW(canvas)
    const h = logicalH(canvas)
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, w, h)
    for(const stroke of strokes) {
      for(let i = 1; i < stroke.length; i++) {
        const prev = stroke[i - 1]!
        const curr = stroke[i]!
        drawSegment(canvas, prev.x * w, prev.y * h, curr.x * w, curr.y * h, curr.p)
      }
    }
  }

  // ── Canvas sizing ──────────────────────────────────────────────────────────

  function sizeCanvas() {
    cancelReplay()
    const canvas  = canvasEl.current
    if(!canvas) return
    const wrapper = canvas.parentElement
    if(!wrapper) return
    const availW  = wrapper.clientWidth
    const availH  = wrapper.clientHeight
    let cssW: number, cssH: number
    if(availW / availH > aspectRatio) {
      cssH = availH
      cssW = cssH * aspectRatio
    }
    else {
      cssW = availW
      cssH = cssW / aspectRatio
    }
    canvas.width  = cssW * window.devicePixelRatio
    canvas.height = cssH * window.devicePixelRatio
    canvas.style.width  = cssW + 'px'
    canvas.style.height = cssH + 'px'
    const ctx = canvas.getContext('2d')!
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    replayStrokes(canvas, allStrokes.current)
  }

  // ── Imperative handle ──────────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    clear() {
      cancelReplay()
      allStrokes.current      = []
      currentRef.current      = []
      isDrawing.current       = false
      activePointerId.current = null
      const canvas = canvasEl.current
      if(canvas) {
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, logicalW(canvas), logicalH(canvas))
      }
    },
    redraw(strokes: NormalizedStroke[][]) {
      cancelReplay()
      allStrokes.current = strokes
      const canvas = canvasEl.current
      if(canvas) replayStrokes(canvas, strokes)
    },
    replay(strokes: NormalizedStroke[][]) {
      cancelReplay()
      allStrokes.current = strokes
      const canvas = canvasEl.current
      if(!canvas) return

      const w = logicalW(canvas)
      const h = logicalH(canvas)
      canvas.getContext('2d')!.clearRect(0, 0, w, h)

      interface DrawEvent {
        fromX: number; fromY: number
        toX:   number; toY:   number
        pressure: number
        t: number
      }

      const events: DrawEvent[] = []
      let globalTOffset = 0

      for(const stroke of strokes) {
        if(stroke.length < 2) continue
        const strokeStart = stroke[0]!.t
        for(let i = 1; i < stroke.length; i++) {
          const prev = stroke[i - 1]!
          const curr = stroke[i]!
          events.push({
            fromX:    prev.x * w,
            fromY:    prev.y * h,
            toX:      curr.x * w,
            toY:      curr.y * h,
            pressure: curr.p,
            t:        globalTOffset + (curr.t - strokeStart) / REPLAY_SPEED,
          })
        }
        const duration = (stroke[stroke.length - 1]!.t - stroke[0]!.t) / REPLAY_SPEED
        globalTOffset += duration + 30 / REPLAY_SPEED
      }

      if(events.length === 0) return

      const startTime = performance.now()

      const frame = () => {
        const elapsed = performance.now() - startTime
        while(events.length > 0 && events[0]!.t <= elapsed) {
          const ev = events.shift()!
          drawSegment(canvas, ev.fromX, ev.fromY, ev.toX, ev.toY, ev.pressure)
        }
        if(events.length > 0) {
          replayRafRef.current = requestAnimationFrame(frame)
        }
        else {
          replayRafRef.current = null
        }
      }

      replayRafRef.current = requestAnimationFrame(frame)
    },
  }))

  // ── Pointer events ─────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasEl.current
    if(!canvas) return

    function normalize(e: PointerEvent): NormalizedStroke {
      const rect = canvas!.getBoundingClientRect()
      const x    = (e.clientX - rect.left)  / rect.width
      const y    = (e.clientY - rect.top)   / rect.height
      const t    = Math.round(e.timeStamp - sessionStart.current)
      const p    = e.pressure || 0.5
      return { x, y, t, p }
    }

    function onPointerDown(e: PointerEvent) {
      if(e.pointerType === 'touch') return
      e.preventDefault()
      canvas!.setPointerCapture(e.pointerId)
      activePointerId.current = e.pointerId
      sessionStart.current    = e.timeStamp
      isDrawing.current       = true
      currentRef.current      = [normalize(e)]
    }

    function onPointerMove(e: PointerEvent) {
      if(e.pointerType === 'touch') return

      if(!isDrawing.current && e.buttons === 1) {
        e.preventDefault()
        canvas!.setPointerCapture(e.pointerId)
        activePointerId.current = e.pointerId
        sessionStart.current    = e.timeStamp
        isDrawing.current       = true
        currentRef.current      = [normalize(e)]
        return
      }

      if(e.pointerId !== activePointerId.current) return
      if(!isDrawing.current) return
      e.preventDefault()

      const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]
      for(const ev of events) {
        const pt = normalize(ev)
        const prev = currentRef.current[currentRef.current.length - 1]!
        const w    = logicalW(canvas!)
        const h    = logicalH(canvas!)
        drawSegment(canvas!, prev.x * w, prev.y * h, pt.x * w, pt.y * h, pt.p)
        currentRef.current = [...currentRef.current, pt]
      }
    }

    function onPointerUp(e: PointerEvent) {
      if(e.pointerId !== activePointerId.current) return
      e.preventDefault()
      if(canvas!.hasPointerCapture(e.pointerId)) canvas!.releasePointerCapture(e.pointerId)
      if(!isDrawing.current) return
      isDrawing.current   = false
      activePointerId.current = null
      if(currentRef.current.length > 0) {
        const stroke = currentRef.current
        allStrokes.current = [...allStrokes.current, stroke]
        currentRef.current = []
        onStrokeAdded(stroke)
      }
    }

    function onPointerCancel(e: PointerEvent) {
      if(e.pointerId !== activePointerId.current) return
      e.preventDefault()
      isDrawing.current = false
      activePointerId.current = null
      if(currentRef.current.length >= 2) {
        const stroke = currentRef.current
        allStrokes.current = [...allStrokes.current, stroke]
        onStrokeAdded(stroke)
      }
      currentRef.current = []
    }

    const opts = { passive: false }
    canvas.addEventListener('pointerdown',   onPointerDown,   opts)
    canvas.addEventListener('pointermove',   onPointerMove,   opts)
    canvas.addEventListener('pointerup',     onPointerUp,     opts)
    canvas.addEventListener('pointercancel', onPointerCancel, opts)
    return () => {
      canvas.removeEventListener('pointerdown',   onPointerDown)
      canvas.removeEventListener('pointermove',   onPointerMove)
      canvas.removeEventListener('pointerup',     onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerCancel)
    }
  }, [onStrokeAdded])

  // ── Sizing ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    sizeCanvas()
    window.addEventListener('resize', sizeCanvas)
    return () => window.removeEventListener('resize', sizeCanvas)
  }, [aspectRatio])

  useEffect(() => () => cancelReplay(), [])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="diagram-canvas-wrapper">
      <canvas ref={canvasEl} className="diagram-canvas" />
    </div>
  )
})
