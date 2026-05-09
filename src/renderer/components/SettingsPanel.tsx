import React from 'react';
import { BrowserSettings, PrivacyLevel, SearchEngine, ThemeMode, SEARCH_ENGINES } from '../../shared/types';
import './SettingsPanel.css';

interface Props {
  settings: BrowserSettings;
  onChange: (partial: Partial<BrowserSettings>) => void;
  onClose: () => void;
}

const PRIVACY_OPTIONS: { value: PrivacyLevel; label: string }[] = [
  { value: 'strict', label: '严格 — 拦截所有追踪，随机化指纹' },
  { value: 'balanced', label: '平衡 — 拦截已知追踪，保留部分功能' },
  { value: 'relaxed', label: '宽松 — 仅拦截恶意域名' },
];

const THEME_OPTIONS: { value: ThemeMode; label: string; preview: string }[] = [
  { value: 'dark',     label: '暗色',     preview: '#1e1e2e' },
  { value: 'light',    label: '亮色',     preview: '#eff1f5' },
  { value: 'midnight', label: '午夜蓝',   preview: '#0f0f1a' },
  { value: 'forest',   label: '森林绿',   preview: '#1a221e' },
  { value: 'sunset',   label: '日落橙',   preview: '#241a1a' },
  { value: 'ocean',    label: '海洋蓝',   preview: '#181f28' },
  { value: 'lavender', label: '薰衣草紫', preview: '#1e1a28' },
  { value: 'system',   label: '跟随系统', preview: 'auto' },
];

const ENGINE_OPTIONS = Object.entries(SEARCH_ENGINES) as [SearchEngine, { name: string; icon: string }][];

export default function SettingsPanel({ settings, onChange, onClose }: Props) {
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>设置</h3>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-body">
          <div className="settings-group">
            <label className="settings-label">隐私级别</label>
            <div className="settings-options">
              {PRIVACY_OPTIONS.map((opt) => (
                <label key={opt.value} className="settings-radio">
                  <input
                    type="radio"
                    name="privacyLevel"
                    checked={settings.privacyLevel === opt.value}
                    onChange={() => onChange({ privacyLevel: opt.value })}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="settings-group">
            <label className="settings-label">主题</label>
            <div className="settings-options">
              {THEME_OPTIONS.map((opt) => (
                <label key={opt.value} className="settings-radio">
                  <input
                    type="radio"
                    name="theme"
                    checked={settings.theme === opt.value}
                    onChange={() => onChange({ theme: opt.value })}
                  />
                  {opt.preview !== 'auto' && (
                    <span className="theme-dot" style={{ background: opt.preview }} />
                  )}
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="settings-group">
            <label className="settings-label">默认搜索引擎</label>
            <select
              className="settings-select"
              value={settings.searchEngine}
              onChange={(e) => onChange({ searchEngine: e.target.value as SearchEngine })}
            >
              {ENGINE_OPTIONS.map(([key, def]) => (
                <option key={key} value={key}>{def.icon} {def.name}</option>
              ))}
            </select>
          </div>

          <div className="settings-group">
            <label className="settings-label">
              <input type="checkbox" checked={settings.httpsOnly} onChange={(e) => onChange({ httpsOnly: e.target.checked })} />
              <span>自动升级到 HTTPS</span>
            </label>
          </div>

          <div className="settings-group">
            <label className="settings-label">
              <input type="checkbox" checked={settings.blockTrackers} onChange={(e) => onChange({ blockTrackers: e.target.checked })} />
              <span>启用追踪拦截</span>
            </label>
          </div>

          <div className="settings-group">
            <label className="settings-label">
              <input type="checkbox" checked={settings.blockFingerprinting} onChange={(e) => onChange({ blockFingerprinting: e.target.checked })} />
              <span>启用指纹防护</span>
            </label>
          </div>

          <div className="settings-group">
            <label className="settings-label">
              <input type="checkbox" checked={settings.cleanupOnExit} onChange={(e) => onChange({ cleanupOnExit: e.target.checked })} />
              <span>退出时自动清除所有数据</span>
            </label>
          </div>

          <div className="settings-group">
            <label className="settings-label">最大活跃标签数</label>
            <input type="range" min="2" max="20" value={settings.maxActiveTabs} onChange={(e) => onChange({ maxActiveTabs: parseInt(e.target.value) })} />
            <span className="settings-value">{settings.maxActiveTabs}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
