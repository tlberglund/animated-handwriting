import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import type { DiagramSummary } from '../types'

interface Props {
  selectedId:    string | null
  onSelect:      (diagram: DiagramSummary) => void
  onNewDiagram:  () => void
}

export default function DiagramRoster({ selectedId, onSelect, onNewDiagram }: Props) {
  const queryClient = useQueryClient()

  const { data: diagrams = [] } = useQuery({
    queryKey: ['diagrams'],
    queryFn:  () => api.listDiagrams(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteDiagram(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diagrams'] }),
  })

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if(confirm('Delete this diagram?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="diagram-roster">
      <button className="btn-new-diagram" onClick={onNewDiagram}>
        + New Diagram
      </button>
      {diagrams.length === 0 ? (
        <div className="diagram-roster-empty">No diagrams yet</div>
      ) : (
        <ul className="diagram-list">
          {diagrams.map(d => (
            <li
              key={d.id}
              className={`diagram-list-item${d.id === selectedId ? ' diagram-list-item--selected' : ''}`}
              onClick={() => onSelect(d)}
            >
              <div className="diagram-list-info">
                <span className="diagram-list-name">{d.name}</span>
                <span className="diagram-list-date">
                  {new Date(d.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                className="btn-delete-diagram"
                onClick={e => handleDelete(e, d.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
