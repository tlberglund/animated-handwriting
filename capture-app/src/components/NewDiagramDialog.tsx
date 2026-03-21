import { useState } from 'react'

const PRESETS = [
  { label: '16:9',  ratio: 16 / 9  },
  { label: '4:3',   ratio: 4  / 3  },
  { label: '1:1',   ratio: 1       },
  { label: '3:2',   ratio: 3  / 2  },
]

interface Props {
  onConfirm: (name: string, aspectRatio: number) => void
  onCancel:  () => void
}

export default function NewDiagramDialog({ onConfirm, onCancel }: Props) {
  const [name,        setName       ] = useState('')
  const [selected,    setSelected   ] = useState<string>('16:9')
  const [customValue, setCustomValue] = useState('')

  function resolveRatio(): number | null {
    if(selected !== 'custom') {
      return PRESETS.find(p => p.label === selected)?.ratio ?? null
    }
    const parts = customValue.split(':').map(s => parseFloat(s.trim()))
    if(parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
      return parts[0] / parts[1]
    }
    return null
  }

  function handleConfirm() {
    const trimmed = name.trim()
    if(!trimmed) { alert('Please enter a name.'); return }
    const ratio = resolveRatio()
    if(ratio === null) { alert('Please enter a valid aspect ratio (e.g. 3:2).'); return }
    onConfirm(trimmed, ratio)
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h2 className="dialog-title">New Diagram</h2>

        <label className="dialog-label">
          Name
          <input
            className="dialog-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Diagram name"
            autoFocus
          />
        </label>

        <label className="dialog-label">Aspect ratio</label>
        <div className="aspect-ratio-options">
          {PRESETS.map(p => (
            <button
              key={p.label}
              className={`aspect-btn${selected === p.label ? ' aspect-btn--active' : ''}`}
              onClick={() => setSelected(p.label)}
            >
              {p.label}
            </button>
          ))}
          <button
            className={`aspect-btn${selected === 'custom' ? ' aspect-btn--active' : ''}`}
            onClick={() => setSelected('custom')}
          >
            Custom
          </button>
        </div>

        {selected === 'custom' && (
          <input
            className="dialog-input"
            type="text"
            value={customValue}
            onChange={e => setCustomValue(e.target.value)}
            placeholder="e.g. 3:2"
          />
        )}

        <div className="dialog-actions">
          <button className="btn-dialog-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-dialog-confirm" onClick={handleConfirm}>Create</button>
        </div>
      </div>
    </div>
  )
}
