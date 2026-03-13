import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

interface Props {
  captureSetId: string
}

export default function ProgressBar({ captureSetId }: Props) {
  const { data: progress } = useQuery({
    queryKey: ['progress', captureSetId],
    queryFn: () => api.getProgress(captureSetId),
  })

  const captured = progress?.captured ?? 0
  const total    = progress?.total ?? 0
  const pct      = total > 0 ? (captured / total) * 100 : 0

  return (
    <div className="progress-bar">
      <div className="progress-label">{captured} / {total} captured</div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
