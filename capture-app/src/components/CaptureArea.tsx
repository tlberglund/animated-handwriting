import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { CaptureCanvas } from './CaptureCanvas'
import type { CaptureCanvasHandle, Mode } from './CaptureCanvas'
import type { CanvasMeta, GlyphCapture, Stroke } from '../types'

interface Props {
  captureSetId: string
  char: string
}

function qualityClass(count: number) {
  if(count === 0) return 'q-none'
  if(count === 1) return 'q-one'
  return 'q-good'
}

function CaptureThumbnail({ cap, width, height }: { cap: GlyphCapture; width: number; height: number }) {
  const { strokes, canvasMeta } = cap
  const allPoints = strokes.flat()
  if(allPoints.length === 0) return null

  const pad = 8
  const { capHeightY, baselineY } = canvasMeta
  const glyphH  = baselineY - capHeightY
  const minX    = Math.min(...allPoints.map(p => p.x))
  const maxX    = Math.max(...allPoints.map(p => p.x))
  const glyphW  = maxX - minX

  const scaleH  = (height - pad * 2) / (glyphH * 1.35)
  const scaleW  = glyphW > 4 ? (width - pad * 2) / glyphW : scaleH
  const scale   = Math.min(scaleH, scaleW)
  const scaledW = glyphW * scale
  const xOff    = (width - scaledW) / 2 - minX * scale
  const yOff    = pad - capHeightY * scale

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {strokes.filter(s => s.length >= 2).map((stroke, i) => (
        <polyline
          key={i}
          points={stroke.map(pt => `${pt.x * scale + xOff},${pt.y * scale + yOff}`).join(' ')}
          fill="none"
          stroke="#6ba3d4"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

export default function CaptureArea({ captureSetId, char }: Props) {
  const queryClient  = useQueryClient()
  const canvasRef    = useRef<CaptureCanvasHandle>(null)
  const [mode, setMode] = useState<Mode>('capture')

  const { data: glyphDetail } = useQuery({
    queryKey: ['glyph', captureSetId, char],
    queryFn:  () => api.getGlyph(captureSetId, char),
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['glyph',    captureSetId, char] })
    queryClient.invalidateQueries({ queryKey: ['progress', captureSetId] })
    queryClient.invalidateQueries({ queryKey: ['glyphs',   captureSetId] })
    queryClient.invalidateQueries({ queryKey: ['export',   captureSetId] })
  }

  const createCapture = useMutation({
    mutationFn: ({ strokes, canvasMeta }: { strokes: Stroke[][], canvasMeta: CanvasMeta }) =>
      api.createCapture(captureSetId, char, strokes, canvasMeta),
    onSuccess: () => {
      invalidateAll()
      canvasRef.current?.discard()
    },
  })

  const deleteCapture = useMutation({
    mutationFn: (captureId: string) => api.deleteCapture(captureSetId, char, captureId),
    onSuccess: invalidateAll,
  })

  const handleCapture = (strokes: Stroke[][], canvasMeta: CanvasMeta) => {
    createCapture.mutate({ strokes, canvasMeta })
  }

  const handleDelete = (e: React.MouseEvent, captureId: string) => {
    e.stopPropagation()
    if(!confirm('Delete this capture?')) return
    deleteCapture.mutate(captureId)
  }

  const handleTileClick = (cap: GlyphCapture) => {
    if(canvasRef.current?.hasStrokes()) {
      if(!confirm('Discard your current strokes and preview this capture?')) return
      canvasRef.current.discard()
    }
    canvasRef.current?.playCapture(cap.strokes, cap.canvasMeta)
  }

  const [referenceId, setReferenceId] = useState<string | null>(null)

  // Seed referenceId from the DB value once glyphDetail loads (component remounts per char)
  useEffect(() => {
    if(glyphDetail?.defaultCaptureId) setReferenceId(glyphDetail.defaultCaptureId)
  }, [glyphDetail?.defaultCaptureId])

  const setDefaultCapture = useMutation({
    mutationFn: (captureId: string) => api.setDefaultCapture(captureSetId, char, captureId),
  })

  const captures  = glyphDetail?.captures ?? []
  const count     = captures.length
  const isBusy    = createCapture.isPending || deleteCapture.isPending
  // Use the user-selected reference if it still exists, otherwise fall back to first
  const reference = (referenceId ? captures.find(c => c.id === referenceId) : null) ?? captures[0] ?? null

  const isCap  = mode === 'capture'
  const isPost = mode === 'post-preview'

  return (
    <div className="capture-area-row">
      {/* Left column: all controls live here, under the canvas */}
      <div className="canvas-zone">
        <CaptureCanvas
          ref={canvasRef}
          onCapture={handleCapture}
          onModeChange={setMode}
          disabled={isBusy}
          referenceStrokes={reference?.strokes}
          referenceMeta={reference?.canvasMeta}
        />

        <div className="action-bar">
          {isCap  && <button className="action-btn btn-preview" onClick={() => canvasRef.current?.preview()} disabled={isBusy}>Preview</button>}
          {isCap  && <button className="action-btn btn-clear"   onClick={() => canvasRef.current?.clear()}   disabled={isBusy}>Clear</button>}
          {isPost && <button className="action-btn btn-accept"  onClick={() => canvasRef.current?.accept()}  disabled={isBusy}>Accept ✓</button>}
          {isPost && <button className="action-btn btn-discard" onClick={() => canvasRef.current?.discard()} disabled={isBusy}>Discard ✗</button>}
        </div>

        <div className="char-label">
          <div className="char-display">{char}</div>
          <div className="char-type">{glyphDetail?.glyphType ?? ''}</div>
        </div>

        {createCapture.isError && (
          <div className="error-msg">Save failed — please try again</div>
        )}

        <div className="captures-area">
          <div className="captures-label">
            Captures:{' '}
            <span className={`quality-dot ${qualityClass(count)}`} />
            {' '}{count}
          </div>
          <div className="captures-tiles">
            {captures.map(cap => (
              <div
                key={cap.id}
                className="capture-tile"
                onClick={() => handleTileClick(cap)}
              >
                <CaptureThumbnail cap={cap} width={80} height={100} />
                <button
                  className={`capture-tile-ref${cap.id === reference?.id ? ' capture-tile-ref--active' : ''}`}
                  title="Use as ghost reference"
                  onClick={e => { e.stopPropagation(); setReferenceId(cap.id); setDefaultCapture.mutate(cap.id) }}
                  disabled={isBusy}
                >✓</button>
                <button
                  className="capture-tile-del"
                  title="Delete"
                  onClick={e => handleDelete(e, cap.id)}
                  disabled={isBusy}
                >✕</button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Dead zone — hand rest area, no controls */}
      <div className="dead-zone" />
    </div>
  )
}
