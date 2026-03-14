import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { ExportGlyph } from '../types'

interface Props {
  captureSetId: string
  currentChar: string | null
  onNavigate: (char: string) => void
}

const GROUPS = [
  { label: 'Lowercase', type: 'LOWER' },
  { label: 'Uppercase', type: 'UPPER' },
  { label: 'Digits',    type: 'DIGIT' },
  { label: 'Punct.',    type: 'PUNCT' },
  { label: 'Ligatures', type: 'LIGATURE' },
]

function CaptureThumbnails({ glyph }: { glyph: ExportGlyph }) {
  const viewW = Math.max(glyph.width, 0.5) + 0.15
  return (
    <>
      {glyph.captures.map(cap => (
        <svg
          key={cap.id}
          width={22}
          height={32}
          viewBox={`-0.05 -0.2 ${viewW} 1.5`}
          className="roster-thumb"
        >
          {cap.strokes.map((stroke, i) => (
            <polyline
              key={i}
              points={stroke.map(pt => `${pt.x},${pt.y}`).join(' ')}
              fill="none"
              stroke="#6ba3d4"
              strokeWidth={0.07}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      ))}
    </>
  )
}

export default function GlyphRoster({ captureSetId, currentChar, onNavigate }: Props) {
  const { data: glyphs = [] } = useQuery({
    queryKey: ['glyphs', captureSetId],
    queryFn: () => api.listGlyphs(captureSetId),
  })

  const { data: glyphSet } = useQuery({
    queryKey: ['export', captureSetId],
    queryFn: () => api.exportGlyphSet(captureSetId),
    staleTime: 15_000,
  })

  return (
    <div className="glyph-roster">
      <div className="roster-header">Characters</div>
      <div className="roster-scroll">
        {GROUPS.map(group => {
          const chars = glyphs.filter(g => g.glyphType === group.type)
          if(chars.length === 0) return null
          return (
            <div key={group.type}>
              <div className="roster-section-label">{group.label}</div>
              {chars.map(glyph => {
                const exportGlyph = glyphSet?.glyphs[glyph.character]
                const isActive = glyph.character === currentChar
                const hasCaps = glyph.captureCount > 0
                return (
                  <div
                    key={glyph.id}
                    className={`roster-row${isActive ? ' roster-row--active' : ''}`}
                    onClick={() => onNavigate(glyph.character)}
                  >
                    <span className="roster-char">
                      {glyph.character.length > 2
                        ? glyph.character.slice(0, 2)
                        : glyph.character}
                    </span>
                    <div className="roster-thumbs">
                      {exportGlyph
                        ? <CaptureThumbnails glyph={exportGlyph} />
                        : <span className="roster-empty-dash">—</span>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
