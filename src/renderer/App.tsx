import React, { useState, useEffect, useCallback } from 'react';
import { TabState, BrowserSettings, DEFAULT_SETTINGS, ThemeMode } from '../shared/types';
import TabBar from './components/TabBar';
import AddressBar from './components/AddressBar';
import ToolBar from './components/ToolBar';
import StatusBar from './components/StatusBar';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const [tabs, setTabs] = useState<TabState[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [settings, setSettings] = useState<BrowserSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  useEffect(() => {
    window.privbrowser.settings.get().then((s) => {
      setSettings(s);
      applyTheme(s.theme);
    });
    window.privbrowser.tabs.onUpdate((updated) => {
      setTabs((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    });
  }, []);

  const applyTheme = useCallback((mode: ThemeMode) => {
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setTheme(mode);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleCreateTab = useCallback(async (url?: string) => {
    const tab = await window.privbrowser.tabs.create(url);
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
  }, []);

  const handleCloseTab = useCallback(async (tabId: string) => {
    await window.privbrowser.tabs.close(tabId);
    setTabs((prev) => prev.filter((t) => t.id !== tabId));
  }, []);

  const handleSwitchTab = useCallback(async (tabId: string) => {
    await window.privbrowser.tabs.switch(tabId);
    setActiveTabId(tabId);
  }, []);

  const isUrlLike = (input: string): boolean => {
    if (/^(https?:\/\/|about:|ftp:\/\/|file:\/\/)/.test(input)) return true;
    // Domain-like: contains a dot, no spaces, looks like example.com or www.example.com
    if (/^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(\/[^\s]*)?$/.test(input)) return true;
    if (/^localhost(:\d+)?(\/[^\s]*)?$/.test(input)) return true;
    return false;
  };

  const handleNavigate = useCallback(async (url: string) => {
    if (!activeTabId) return;
    let finalUrl = url;
    if (isUrlLike(url)) {
      if (!/^(https?:\/\/|about:)/.test(url)) {
        finalUrl = 'https://' + url;
      }
    } else {
      const searchUrls: Record<string, string> = {
        google: 'https://www.google.com/search?q=',
        duckduckgo: 'https://duckduckgo.com/?q=',
        bing: 'https://www.bing.com/search?q=',
        baidu: 'https://www.baidu.com/s?wd=',
        searxng: 'http://localhost:8080/search?q=',
      };
      finalUrl = (searchUrls[settings.searchEngine] || searchUrls.google) + encodeURIComponent(url);
    }
    await window.privbrowser.nav.go(activeTabId, finalUrl);
  }, [activeTabId, settings.searchEngine]);

  const handleSettingsChange = useCallback(async (partial: Partial<BrowserSettings>) => {
    const updated = await window.privbrowser.settings.set(partial);
    setSettings(updated);
    if (partial.theme) applyTheme(partial.theme);
  }, [applyTheme]);

  return (
    <div className="app">
      <ToolBar
        canGoBack={activeTab?.canGoBack ?? false}
        canGoForward={activeTab?.canGoForward ?? false}
        onBack={() => activeTabId && window.privbrowser.nav.back(activeTabId)}
        onForward={() => activeTabId && window.privbrowser.nav.forward(activeTabId)}
        onReload={() => activeTabId && window.privbrowser.nav.reload(activeTabId)}
        theme={theme}
        onToggleTheme={() => {
          const next = theme === 'dark' ? 'light' : 'dark';
          handleSettingsChange({ theme: next as ThemeMode });
        }}
        onOpenSettings={() => {
          setShowSettings((v) => {
            if (!v) window.privbrowser.tabs.hideActive();
            else window.privbrowser.tabs.showActive();
            return !v;
          });
        }}
      />
      <AddressBar
        url={activeTab?.url ?? ''}
        isLoading={activeTab?.isLoading ?? false}
        blockedCount={activeTab?.blockedCount ?? 0}
        onNavigate={handleNavigate}
      />
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitch={handleSwitchTab}
        onClose={handleCloseTab}
        onCreate={() => handleCreateTab()}
        onPin={(tabId) => window.privbrowser.tabs.pin(tabId)}
      />
      <StatusBar
        privacyLevel={settings.privacyLevel}
        searchEngine={settings.searchEngine}
        isHttps={activeTab?.url.startsWith('https') ?? false}
      />
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => {
            window.privbrowser.tabs.showActive();
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}
