import React from 'react';
import './ToolBar.css';

interface Props {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export default function ToolBar({
  canGoBack, canGoForward, onBack, onForward, onReload,
  theme, onToggleTheme, onOpenSettings,
}: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar-nav">
        <button className="tool-btn" onClick={onBack} disabled={!canGoBack} title="Back">←</button>
        <button className="tool-btn" onClick={onForward} disabled={!canGoForward} title="Forward">→</button>
        <button className="tool-btn" onClick={onReload} title="Reload">↻</button>
      </div>
      <div className="toolbar-title">PrivBrowser</div>
      <div className="toolbar-actions">
        <button className="tool-btn" onClick={onToggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="tool-btn" onClick={onOpenSettings} title="Settings">⚙</button>
      </div>
    </div>
  );
}
