import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { staticRender } from '../staticRenderer'
import type { GlyphDetail } from '../types'

const DEFAULT_PHRASE = 'The quick brown fox jumps over a lazy dog'
const NEUTRAL = { scale: 1.0, yOffset: 0.0 }

// ── Capture thumbnail ──────────────────────────────────────────────────────────

interface ThumbnailProps {
  detail: GlyphDetail
  captureIndex: number
  selected: boolean
  onClick: () => void
}

function CaptureThumbnail({ detail, captureIndex, selected, onClick }: ThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const capture   = detail.captures[captureIndex]

  useEffect(() => {
    const canvas = canvasRef.current
    if(!canvas || !capture) return
    const fakeDetail: GlyphDetail = { ...detail, captures: [capture] }
    staticRender(
      canvas,
      { [detail.character]: fakeDetail },
      detail.character,
      capture.id,
      NEUTRAL,
      { capHeight: 44, topPad: 6, scale: window.devicePixelRatio ?? 1 },
    )
  }, [detail, capture])

  return (
    <div
      className={`adjust-thumbnail${selected ? ' adjust-thumbnail--active' : ''}`}
      onClick={onClick}
    >
      <canvas ref={canvasRef} style={{ width: 56, height: 70, display: 'block' }} />
      <div className="adjust-thumb-label">{captureIndex + 1}</div>
    </div>
  )
}

// ── Slider row ────────────────────────────────────────────────────────────────

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

function SliderRow({ label, value, min, max, step, onChange }: SliderRowProps) {
  return (
    <div className="adjust-slider-row">
      <span className="adjust-slider-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="adjust-slider"
      />
      <span className="adjust-slider-value">{value.toFixed(2)}</span>
    </div>
  )
}

// ── AdjustTab ─────────────────────────────────────────────────────────────────

interface Props {
  captureSetId: string | null
}

export default function AdjustTab({ captureSetId }: Props) {
  const [selectedChar,      setSelectedChar]      = useState<string | null>(null)
  const [selectedCaptureIdx, setSelectedCaptureIdx] = useState(0)
  const [scale,             setScale]             = useState(1.0)
  const [yOffset,           setYOffset]           = useState(0.0)
  const [phrase,            setPhrase]            = useState(DEFAULT_PHRASE)
  const saveTimer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewRef     = useRef<HTMLCanvasElement>(null)
  const queryClient    = useQueryClient()

  // ── Character list ─────────────────────────────────────────────────────────

  const { data: summaries = [] } = useQuery({
    queryKey: ['glyphs', captureSetId],
    queryFn:  () => api.listGlyphs(captureSetId!),
    enabled:  captureSetId !== null,
  })

  // ── Selected character detail ──────────────────────────────────────────────

  const { data: selectedDetail } = useQuery({
    queryKey: ['glyph', captureSetId, selectedChar],
    queryFn:  () => api.getGlyph(captureSetId!, selectedChar!),
    enabled:  captureSetId !== null && selectedChar !== null,
  })

  const selectedCapture = selectedDetail?.captures[selectedCaptureIdx] ?? null

  // ── Adjustment for selected capture ───────────────────────────────────────

  const { data: savedAdj } = useQuery({
    queryKey: ['adjustment', captureSetId, selectedChar, selectedCapture?.id],
    queryFn:  () => api.getAdjustment(captureSetId!, selectedChar!, selectedCapture!.id),
    enabled:  captureSetId !== null && selectedChar !== null && selectedCapture !== null,
  })

  useEffect(() => {
    setScale(savedAdj?.scale   ?? 1.0)
    setYOffset(savedAdj?.yOffset ?? 0.0)
  }, [savedAdj])

  // Reset capture index when character changes
  useEffect(() => {
    setSelectedCaptureIdx(0)
  }, [selectedChar])

  // ── Phrase glyph loading ───────────────────────────────────────────────────

  const phraseChars = [...new Set(phrase.split('').filter(c => c !== ' '))]

  const phraseQueries = useQueries({
    queries: phraseChars.map(c => ({
      queryKey: ['glyph', captureSetId, c],
      queryFn:  () => api.getGlyph(captureSetId!, c),
      enabled:  captureSetId !== null,
    })),
  })

  const phraseGlyphs: Record<string, GlyphDetail> = {}
  phraseChars.forEach((c, i) => {
    const d = phraseQueries[i]?.data
    if(d) phraseGlyphs[c] = d
  })

  // ── Phrase preview render ──────────────────────────────────────────────────

  useEffect(() => {
    const canvas = previewRef.current
    if(!canvas || Object.keys(phraseGlyphs).length === 0) return
    staticRender(
      canvas,
      phraseGlyphs,
      phrase,
      selectedCapture?.id ?? null,
      { scale, yOffset },
      { capHeight: 56, topPad: 10 },
    )
  })

  // ── Debounced save ─────────────────────────────────────────────────────────

  const scheduleSave = useCallback((s: number, yo: number) => {
    if(saveTimer.current) clearTimeout(saveTimer.current)
    if(!captureSetId || !selectedChar || !selectedCapture) return
    saveTimer.current = setTimeout(async () => {
      await api.putAdjustment(captureSetId, selectedChar, selectedCapture.id, s, yo)
      queryClient.invalidateQueries({
        queryKey: ['adjustment', captureSetId, selectedChar, selectedCapture.id],
      })
    }, 400)
  }, [captureSetId, selectedChar, selectedCapture, queryClient])

  const handleScaleChange = (v: number) => { setScale(v);   scheduleSave(v, yOffset) }
  const handleYOffsetChange = (v: number) => { setYOffset(v); scheduleSave(scale, v)  }

  const handleReset = async () => {
    if(saveTimer.current) clearTimeout(saveTimer.current)
    setScale(1.0)
    setYOffset(0.0)
    if(captureSetId && selectedChar && selectedCapture) {
      await api.putAdjustment(captureSetId, selectedChar, selectedCapture.id, 1.0, 0.0)
      queryClient.invalidateQueries({
        queryKey: ['adjustment', captureSetId, selectedChar, selectedCapture.id],
      })
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if(!captureSetId) {
    return <div className="empty-state">Select a capture set to begin</div>
  }

  const withCaptures = summaries.filter(s => s.captureCount > 0)

  return (
    <div className="adjust-tab">
      <div className="adjust-main">

        {/* Character list */}
        <div className="adjust-char-list">
          <div className="roster-header">Characters</div>
          <div className="roster-scroll">
            {withCaptures.map(s => (
              <div
                key={s.character}
                className={`adjust-char-row${selectedChar === s.character ? ' adjust-char-row--active' : ''}`}
                onClick={() => setSelectedChar(s.character)}
              >
                <span className="roster-char">{s.character}</span>
                <span className="adjust-capture-count">{s.captureCount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Adjustment panel */}
        <div className="adjust-panel">
          {selectedChar && selectedDetail ? (
            <>
              {/* Capture thumbnails */}
              <div className="adjust-thumbnails">
                {selectedDetail.captures.map((_, idx) => (
                  <CaptureThumbnail
                    key={idx}
                    detail={selectedDetail}
                    captureIndex={idx}
                    selected={idx === selectedCaptureIdx}
                    onClick={() => setSelectedCaptureIdx(idx)}
                  />
                ))}
              </div>

              {/* Sliders */}
              <div className="adjust-controls">
                <SliderRow
                  label="Scale"
                  value={scale}
                  min={0.5} max={1.5} step={0.01}
                  onChange={handleScaleChange}
                />
                <SliderRow
                  label="Y offset"
                  value={yOffset}
                  min={-0.5} max={0.5} step={0.01}
                  onChange={handleYOffsetChange}
                />
                <button className="adjust-reset-btn" onClick={handleReset}>
                  Reset
                </button>
              </div>
            </>
          ) : (
            <div className="adjust-hint">
              {withCaptures.length === 0
                ? 'No captures yet — capture some glyphs first'
                : 'Select a character'}
            </div>
          )}

          {/* Phrase preview */}
          <div className="adjust-preview-area">
            <input
              className="adjust-phrase-input"
              value={phrase}
              onChange={e => setPhrase(e.target.value)}
              placeholder="Preview phrase…"
            />
            <div className="adjust-preview-canvas-wrap">
              <canvas
                ref={previewRef}
                className="adjust-preview-canvas"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
