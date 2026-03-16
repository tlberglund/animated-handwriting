import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

interface Props {
  captureSetId: string | null
  onSetChange: (id: string | null) => void
  onOpenGrid: () => void
}

export default function TopBar({ captureSetId, onSetChange, onOpenGrid }: Props) {
  const queryClient = useQueryClient()
  const [isExporting, setIsExporting] = useState(false)

  const { data: sets = [], isError } = useQuery({
    queryKey: ['captureSets'],
    queryFn: api.listCaptureSets,
  })

  const createSet = useMutation({
    mutationFn: (name: string) => api.createCaptureSet(name),
    onSuccess: (newSet) => {
      queryClient.invalidateQueries({ queryKey: ['captureSets'] })
      onSetChange(newSet.id)
    },
  })

  const handleNewSet = () => {
    const name = prompt('Name for the new capture set:')
    if(!name?.trim()) return
    createSet.mutate(name.trim())
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSetChange(e.target.value || null)
  }

  const handleExport = async () => {
    if(!captureSetId || isExporting) return
    setIsExporting(true)
    try {
      const data = await api.exportGlyphSet(captureSetId)
      const setName = sets.find(s => s.id === captureSetId)?.name ?? captureSetId
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${setName}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
    finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="top-bar">
      {isError ? (
        <span style={{ color: '#ff3b30', flex: 1, fontSize: 14 }}>Could not reach server</span>
      ) : (
        <select
          className="set-selector"
          value={captureSetId ?? ''}
          onChange={handleChange}
        >
          <option value="">— select a capture set —</option>
          {sets.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}
      <button
        className="btn-new-set"
        onClick={handleNewSet}
        disabled={createSet.isPending}
      >
        + New Set
      </button>
      <button className="btn-open-grid" onClick={onOpenGrid}>
        Characters
      </button>
      <button
        className="btn-export"
        onClick={handleExport}
        disabled={!captureSetId || isExporting}
      >
        {isExporting ? 'Exporting…' : 'Export'}
      </button>
    </div>
  )
}
