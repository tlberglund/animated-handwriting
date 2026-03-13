import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { CaptureCanvas } from './CaptureCanvas'
import type { CaptureCanvasHandle } from './CaptureCanvas'
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

export default function CaptureArea({ captureSetId, char }: Props) {
  const queryClient  = useQueryClient()
  const canvasRef    = useRef<CaptureCanvasHandle>(null)

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
    onSuccess: invalidateAll,
  })

  const deleteCapture = useMutation({
    mutationFn: (captureId: string) => api.deleteCapture(captureSetId, char, captureId),
    onSuccess: invalidateAll,
  })

  const handleCapture = (strokes: Stroke[][], canvasMeta: CanvasMeta) => {
    createCapture.mutate({ strokes, canvasMeta })
  }

  const handleDelete = (captureId: string) => {
    if(!confirm('Delete this capture?')) return
    deleteCapture.mutate(captureId)
  }

  const handlePlay = (cap: GlyphCapture) => {
    canvasRef.current?.playCapture(cap.strokes)
  }

  const captures  = glyphDetail?.captures ?? []
  const count     = captures.length
  const isBusy    = createCapture.isPending || deleteCapture.isPending
  const reference = captures[0] ?? null

  return (
    <>
      <div className="char-label">
        <div className="char-display">{char}</div>
        <div className="char-type">{glyphDetail?.glyphType ?? ''}</div>
      </div>

      <CaptureCanvas
        ref={canvasRef}
        onCapture={handleCapture}
        disabled={isBusy}
        referenceStrokes={reference?.strokes}
        referenceMeta={reference?.canvasMeta}
      />

      {createCapture.isError && (
        <div className="error-msg">Save failed — please try again</div>
      )}

      <div className="captures-strip">
        <div className="captures-label">
          Existing captures:{' '}
          <span className={`quality-dot ${qualityClass(count)}`} />
          {' '}{count}
        </div>
        <div className="captures-list">
          {captures.map((cap, idx) => (
            <div key={cap.id} className="capture-chip">
              <span>#{idx + 1}</span>
              <button
                className="play-btn"
                title="Preview"
                onClick={() => handlePlay(cap)}
                disabled={isBusy}
              >▶</button>
              <button
                className="del-btn"
                title="Delete"
                onClick={() => handleDelete(cap.id)}
                disabled={isBusy}
              >✕</button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
