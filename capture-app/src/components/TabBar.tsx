export type Tab = 'handwriting' | 'diagrams' | 'adjust'

interface TabBarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="tab-bar">
      <button
        className={`tab-btn${activeTab === 'handwriting' ? ' tab-btn--active' : ''}`}
        onClick={() => onTabChange('handwriting')}
      >
        Handwriting
      </button>
      <button
        className={`tab-btn${activeTab === 'diagrams' ? ' tab-btn--active' : ''}`}
        onClick={() => onTabChange('diagrams')}
      >
        Diagrams
      </button>
      <button
        className={`tab-btn${activeTab === 'adjust' ? ' tab-btn--active' : ''}`}
        onClick={() => onTabChange('adjust')}
      >
        Adjust
      </button>
    </div>
  )
}
