import React from 'react';
import { TabState } from '../../shared/types';
import './TabBar.css';

interface Props {
  tabs: TabState[];
  activeTabId: string | null;
  onSwitch: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onCreate: () => void;
  onPin: (tabId: string) => void;
}

export default function TabBar({ tabs, activeTabId, onSwitch, onClose, onCreate, onPin }: Props) {
  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    const action = confirm('Pin this tab? (OK = pin, Cancel = close others)');
    if (action) {
      onPin(tabId);
    }
  };

  return (
    <div className="tab-bar">
      <div className="tab-list">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? 'tab--active' : ''} ${tab.isPinned ? 'tab--pinned' : ''}`}
            onClick={() => onSwitch(tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            onAuxClick={(e) => { if (e.button === 1) onClose(tab.id); }}
          >
            <span className="tab-icon">{tab.isPinned ? '📌' : tab.isLoading ? '⏳' : '🌐'}</span>
            <span className="tab-title">{tab.title.slice(0, 30)}</span>
            {!tab.isPinned && (
              <button
                className="tab-close"
                onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
              >×</button>
            )}
          </div>
        ))}
      </div>
      <button className="tab-new" onClick={() => onCreate()}>+</button>
    </div>
  );
}
