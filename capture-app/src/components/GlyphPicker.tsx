import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

interface Props {
  captureSetId: string
  currentChar: string | null
  onSelect: (char: string) => void
  onClose: () => void
}

const GROUPS = [
  { label: 'Lowercase', type: 'LOWER' },
  { label: 'Uppercase', type: 'UPPER' },
  { label: 'Digits',    type: 'DIGIT' },
  { label: 'Punct.',    type: 'PUNCT' },
  { label: 'Ligatures', type: 'LIGATURE' },
]

function qualityClass(count: number) {
  if(count === 0) return 'q-none'
  if(count === 1) return 'q-one'
  return 'q-good'
}

export default function GlyphPicker({ captureSetId, currentChar, onSelect, onClose }: Props) {
  const { data: glyphs = [] } = useQuery({
    queryKey: ['glyphs', captureSetId],
    queryFn: () => api.listGlyphs(captureSetId),
  })

  return (
    <div className="char-grid-overlay">
      <div className="char-grid-header">
        <h2>All Characters</h2>
        <button className="btn-close-grid" onClick={onClose}>✕</button>
      </div>
      <div className="char-grid">
        {GROUPS.map(group => {
          const chars = glyphs.filter(g => g.glyphType === group.type)
          if(chars.length === 0) return null
          return (
            <div key={group.type} style={{ width: '100%', display: 'contents' }}>
              <div className="grid-section-label">{group.label}</div>
              {chars.map(glyph => (
                <div
                  key={glyph.id}
                  className={`grid-cell${glyph.character === currentChar ? ' active' : ''}`}
                  onClick={() => onSelect(glyph.character)}
                >
                  <span className="glyph-char">
                    {glyph.character.length > 2 ? glyph.character.substring(0, 3) : glyph.character}
                  </span>
                  <span className={`glyph-dot ${qualityClass(glyph.captureCount)}`} />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
