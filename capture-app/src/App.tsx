import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import TopBar from './components/TopBar'
import ProgressBar from './components/ProgressBar'
import GlyphPicker from './components/GlyphPicker'
import CaptureArea from './components/CaptureArea'
import GlyphRoster from './components/GlyphRoster'
import TabBar, { Tab } from './components/TabBar'
import DiagramArea from './components/DiagramArea'

export default function App() {
  const [captureSetId, setCaptureSetId] = useState<string | null>(null)
  const [currentChar, setCurrentChar] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('handwriting')

  const { data: progress } = useQuery({
    queryKey: ['progress', captureSetId],
    queryFn: () => api.getProgress(captureSetId!),
    enabled: captureSetId !== null,
  })

  // Auto-navigate to first uncaptured when a set is selected and no char is active
  useEffect(() => {
    if(currentChar === null && progress?.nextUncaptured) {
      setCurrentChar(progress.nextUncaptured)
    }
  }, [progress?.nextUncaptured, currentChar])

  const handleSetChange = (id: string | null) => {
    setCaptureSetId(id)
    setCurrentChar(null)
  }

  const handleNavigate = (char: string) => {
    setCurrentChar(char)
    setShowGrid(false)
  }

  return (
    <>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'handwriting' && (
        <>
          <TopBar
            captureSetId={captureSetId}
            onSetChange={handleSetChange}
            onOpenGrid={() => setShowGrid(true)}
          />
          {captureSetId && (
            <ProgressBar captureSetId={captureSetId} />
          )}
          <div id="main">
            <div className="capture-section">
              {captureSetId && currentChar ? (
                <CaptureArea
                  key={`${captureSetId}:${currentChar}`}
                  captureSetId={captureSetId}
                  char={currentChar}
                />
              ) : (
                <div className="empty-state">
                  {captureSetId
                    ? 'Select a character to begin'
                    : 'Select or create a capture set to begin'}
                </div>
              )}
            </div>
            {captureSetId && (
              <GlyphRoster
                captureSetId={captureSetId}
                currentChar={currentChar}
                onNavigate={handleNavigate}
              />
            )}
          </div>
          {showGrid && captureSetId && (
            <GlyphPicker
              captureSetId={captureSetId}
              currentChar={currentChar}
              onSelect={handleNavigate}
              onClose={() => setShowGrid(false)}
            />
          )}
        </>
      )}
      {activeTab === 'diagrams' && (
        <DiagramArea />
      )}
    </>
  )
}
