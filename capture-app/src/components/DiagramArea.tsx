import { useRef, useState, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import type { DiagramSummary, NormalizedStroke } from '../types'
import { DiagramCanvas, DiagramCanvasHandle } from './DiagramCanvas'
import DiagramRoster from './DiagramRoster'
import NewDiagramDialog from './NewDiagramDialog'

interface SelectedDiagram {
  id:          string
  name:        string
  aspectRatio: number
}

export default function DiagramArea() {
  const queryClient = useQueryClient()
  const canvasRef   = useRef<DiagramCanvasHandle>(null)

  const [selected,       setSelected      ] = useState<SelectedDiagram | null>(null)
  const [undoStack,      setUndoStack     ] = useState<NormalizedStroke[][]>([])
  const [redoStack,      setRedoStack     ] = useState<NormalizedStroke[][]>([])
  const [showNewDialog,  setShowNewDialog ] = useState(false)
  const [saving,         setSaving        ] = useState(false)
  const [exporting,      setExporting     ] = useState(false)
  const pendingReplay    = useRef<NormalizedStroke[][] | null>(null)

  useEffect(() => {
    if(pendingReplay.current !== null) {
      canvasRef.current?.replay(pendingReplay.current)
      pendingReplay.current = null
    }
  }, [selected])

  // ── Stroke capture ─────────────────────────────────────────────────────────

  const handleStrokeAdded = useCallback((stroke: NormalizedStroke[]) => {
    setUndoStack(prev => [...prev, stroke])
    setRedoStack([])
  }, [])

  // ── Undo / Redo ────────────────────────────────────────────────────────────

  function undo() {
    if(undoStack.length === 0) return
    const last    = undoStack[undoStack.length - 1]!
    const newUndo = undoStack.slice(0, -1)
    setUndoStack(newUndo)
    setRedoStack(prev => [last, ...prev])
    canvasRef.current?.redraw(newUndo)
  }

  function redo() {
    if(redoStack.length === 0) return
    const first   = redoStack[0]!
    const newRedo = redoStack.slice(1)
    const newUndo = [...undoStack, first]
    setRedoStack(newRedo)
    setUndoStack(newUndo)
    canvasRef.current?.redraw(newUndo)
  }

  // ── Clear ──────────────────────────────────────────────────────────────────

  function handleClear() {
    setUndoStack([])
    setRedoStack([])
    canvasRef.current?.clear()
  }

  // ── Diagram selection ──────────────────────────────────────────────────────

  async function handleSelect(summary: DiagramSummary) {
    const detail = await api.getDiagram(summary.id)
    setSelected({ id: detail.id, name: detail.name, aspectRatio: detail.aspectRatio })
    setUndoStack(detail.strokes)
    setRedoStack([])
    pendingReplay.current = detail.strokes
  }

  // ── New diagram ────────────────────────────────────────────────────────────

  async function handleNewConfirm(name: string, aspectRatio: number) {
    setShowNewDialog(false)
    const detail = await api.createDiagram(name, aspectRatio)
    queryClient.invalidateQueries({ queryKey: ['diagrams'] })
    setSelected({ id: detail.id, name: detail.name, aspectRatio: detail.aspectRatio })
    setUndoStack([])
    setRedoStack([])
    canvasRef.current?.clear()
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    if(!selected) return
    if(undoStack.length === 0) {
      if(!confirm('Save with no strokes? This will clear the stored diagram.')) return
    }
    setSaving(true)
    try {
      await api.updateDiagram(selected.id, undoStack)
      queryClient.invalidateQueries({ queryKey: ['diagrams'] })
    }
    finally {
      setSaving(false)
    }
  }

  // ── Export ────────────────────────────────────────────────────────────────

  async function handleExport() {
    if(!selected || exporting) return
    setExporting(true)
    try {
      const data = await api.exportDiagram(selected.id)
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${selected.name}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
    finally {
      setExporting(false)
    }
  }

  // ── Cancel (deselect) ──────────────────────────────────────────────────────

  function handleCancel() {
    setSelected(null)
    setUndoStack([])
    setRedoStack([])
    canvasRef.current?.clear()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="diagram-area">
      <DiagramRoster
        selectedId={selected?.id ?? null}
        onSelect={handleSelect}
        onNewDiagram={() => setShowNewDialog(true)}
      />

      <div className="diagram-workspace">
        {selected ? (
          <>
            <div className="diagram-toolbar">
              <span className="diagram-name">{selected.name}</span>
              <button className="tool-btn" onClick={undo}  disabled={undoStack.length === 0}>Undo</button>
              <button className="tool-btn" onClick={redo}  disabled={redoStack.length === 0}>Redo</button>
              <button className="tool-btn" onClick={handleClear}>Clear</button>
              <button className="tool-btn tool-btn--save" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="tool-btn tool-btn--export" onClick={handleExport} disabled={exporting}>
                {exporting ? 'Exporting…' : 'Export'}
              </button>
              <button className="tool-btn tool-btn--cancel" onClick={handleCancel}>Cancel</button>
            </div>
            <div className="diagram-canvas-area">
              <DiagramCanvas
                ref={canvasRef}
                aspectRatio={selected.aspectRatio}
                onStrokeAdded={handleStrokeAdded}
              />
            </div>
          </>
        ) : (
          <div className="empty-state">Select a diagram or create a new one</div>
        )}
      </div>

      {showNewDialog && (
        <NewDiagramDialog
          onConfirm={handleNewConfirm}
          onCancel={() => setShowNewDialog(false)}
        />
      )}
    </div>
  )
}
