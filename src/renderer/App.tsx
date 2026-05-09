import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserSettings, DEFAULT_SETTINGS, ThemeMode, SEARCH_ENGINES, FONT_FAMILIES } from '../shared/types';
import TabBar from './components/TabBar';
import AddressBar from './components/AddressBar';
import ToolBar from './components/ToolBar';
import StatusBar from './components/StatusBar';
import SettingsPanel from './components/SettingsPanel';
import NewTabPage from './components/NewTabPage';
import BookmarksPanel from './components/BookmarksPanel';
import BookmarksBar from './components/BookmarksBar';
import BookmarkEditDialog, { Bookmark } from './components/BookmarkEditDialog';
import WebViewComponent, { WebViewHandle } from './components/WebView';

interface TabInfo {
  id: string;
  url: string;
  title: string;
  favicon: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  partitionKey: string;
  isPinned: boolean;
}

let tabCounter = 0;

function newTabInfo(url?: string): TabInfo {
  const id = `tab-${++tabCounter}-${Date.now()}`;
  return {
    id,
    url: url || '',
    title: 'New Tab',
    favicon: '',
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    partitionKey: `persist:tab-${id}`,
    isPinned: false,
  };
}

export default function App() {
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [settings, setSettings] = useState<BrowserSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showBookmarkEdit, setShowBookmarkEdit] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [preloadPath, setPreloadPath] = useState('');

  const wvRefs = useRef<Map<string, WebViewHandle>>(new Map());
  const themeCycle: ThemeMode[] = ['dark', 'midnight', 'forest', 'sunset', 'ocean', 'lavender', 'light'];

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  // Init
  useEffect(() => {
    window.privbrowser.settings.get().then((s: BrowserSettings) => {
      setSettings(s);
      applyTheme(s.theme);
      document.documentElement.style.setProperty('--font-family', FONT_FAMILIES[s.font].css);
    });
    window.privbrowser.bookmarks.get().then(setBookmarks);
    window.privbrowser.getPreloadPath().then(setPreloadPath);

    // Auto-create first tab
    const tab = newTabInfo();
    setTabs([tab]);
    setActiveTabId(tab.id);
    window.privbrowser.session.ensure(tab.partitionKey);
  }, []);

  const applyTheme = useCallback((mode: ThemeMode) => {
    if (mode === 'system') {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } else {
      setTheme(mode);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Tab management
  const handleCreateTab = useCallback((url?: string) => {
    const tab = newTabInfo(url);
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
    window.privbrowser.session.ensure(tab.partitionKey);
  }, []);

  const handleCloseTab = useCallback((tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && !tab.isPinned) {
      window.privbrowser.session.clear(tab.partitionKey);
    }
    wvRefs.current.delete(tabId);
    setTabs((prev) => prev.filter((t) => t.id !== tabId));
  }, [tabs]);

  const handleSwitchTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const handlePinTab = useCallback((tabId: string) => {
    setTabs((prev) => prev.map((t) => t.id === tabId ? { ...t, isPinned: !t.isPinned } : t));
  }, []);

  // Tab state updates from webview
  const updateTab = useCallback((tabId: string, patch: Partial<TabInfo>) => {
    setTabs((prev) => prev.map((t) => t.id === tabId ? { ...t, ...patch } : t));
  }, []);

  // Navigation
  const isUrlLike = (input: string): boolean => {
    if (/^(https?:\/\/|about:|ftp:\/\/|file:\/\/)/.test(input)) return true;
    if (/^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(\/[^\s]*)?$/.test(input)) return true;
    if (/^localhost(:\d+)?(\/[^\s]*)?$/.test(input)) return true;
    return false;
  };

  const resolveUrl = useCallback((input: string): string => {
    if (isUrlLike(input)) {
      if (!/^(https?:\/\/|about:)/.test(input)) return 'https://' + input;
      return input;
    }
    const urls: Record<string, string> = {
      google: 'https://www.google.com/search?q=',
      duckduckgo: 'https://duckduckgo.com/?q=',
      bing: 'https://www.bing.com/search?q=',
      baidu: 'https://www.baidu.com/s?wd=',
    };
    return (urls[settings.searchEngine] || urls.google) + encodeURIComponent(input);
  }, [settings.searchEngine]);

  const handleNavigate = useCallback((url: string) => {
    let tabId = activeTabId;
    if (!tabId) {
      const tab = newTabInfo();
      setTabs((prev) => [...prev, tab]);
      setActiveTabId(tab.id);
      tabId = tab.id;
      window.privbrowser.session.ensure(tab.partitionKey);
    }
    const finalUrl = resolveUrl(url);
    updateTab(tabId, { url: finalUrl, isLoading: true });
    // WebView will handle the actual navigation via its src prop
    // We need to trigger navigation via the webview ref
    const wv = wvRefs.current.get(tabId);
    if (wv) {
      wv.loadURL(finalUrl);
    } else {
      // New tab — webview hasn't been created yet, set the URL in state
      // and the webview will be created with this URL
    }
  }, [activeTabId, resolveUrl, updateTab]);

  const handleNavAction = useCallback((action: 'back' | 'forward' | 'reload' | 'stop') => {
    const wv = activeTabId ? wvRefs.current.get(activeTabId) : null;
    if (!wv) return;
    if (action === 'back') wv.goBack();
    else if (action === 'forward') wv.goForward();
    else if (action === 'reload') wv.reload();
    else if (action === 'stop') wv.stop();
  }, [activeTabId]);

  // Bookmarks
  const existingBookmark = activeTab?.url ? bookmarks.find((b) => b.url === activeTab.url) : null;
  const isBookmarked = !!existingBookmark;
  const folders = [...new Set(bookmarks.map((b) => b.folder).filter(Boolean))] as string[];

  const handleToggleBookmark = useCallback(() => {
    if (!activeTab?.url || activeTab.url === 'about:blank') return;
    setShowBookmarkEdit(true);
  }, [activeTab]);

  const handleSaveBookmark = useCallback(async (bm: Bookmark) => {
    if (existingBookmark) await window.privbrowser.bookmarks.remove(activeTab!.url);
    await window.privbrowser.bookmarks.add(bm);
    setBookmarks(await window.privbrowser.bookmarks.get());
    setShowBookmarkEdit(false);
  }, [existingBookmark, activeTab]);

  const handleDeleteBookmark = useCallback(async () => {
    if (activeTab?.url) setBookmarks(await window.privbrowser.bookmarks.remove(activeTab.url));
    setShowBookmarkEdit(false);
  }, [activeTab]);

  const handleRemoveBookmark = useCallback(async (url: string) => {
    setBookmarks(await window.privbrowser.bookmarks.remove(url));
  }, []);

  // Settings
  const handleSettingsChange = useCallback(async (partial: Partial<BrowserSettings>) => {
    const updated = await window.privbrowser.settings.set(partial);
    setSettings(updated);
    if (partial.theme) applyTheme(partial.theme);
    if (partial.font) document.documentElement.style.setProperty('--font-family', FONT_FAMILIES[partial.font].css);
  }, [applyTheme]);

  const handleNewWindow = useCallback((url: string) => {
    const tab = newTabInfo(url);
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
    window.privbrowser.session.ensure(tab.partitionKey);
  }, []);

  return (
    <div className="app">
      <ToolBar
        canGoBack={activeTab?.canGoBack ?? false}
        canGoForward={activeTab?.canGoForward ?? false}
        isLoading={activeTab?.isLoading ?? false}
        onBack={() => handleNavAction('back')}
        onForward={() => handleNavAction('forward')}
        onStop={() => handleNavAction('stop')}
        onReload={() => handleNavAction('reload')}
        theme={theme}
        onToggleTheme={() => {
          const idx = themeCycle.indexOf(theme === 'system' ? 'dark' : theme);
          handleSettingsChange({ theme: themeCycle[(idx + 1) % themeCycle.length] });
        }}
        onOpenBookmarks={() => setShowBookmarks((v) => !v)}
        onOpenSettings={() => setShowSettings((v) => !v)}
      />
      <AddressBar
        url={activeTab?.url ?? ''}
        isLoading={activeTab?.isLoading ?? false}
        blockedCount={0}
        isBookmarked={isBookmarked}
        onNavigate={handleNavigate}
        onToggleBookmark={handleToggleBookmark}
      />
      <BookmarksBar bookmarks={bookmarks} onNavigate={handleNavigate} />
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitch={handleSwitchTab}
        onClose={handleCloseTab}
        onCreate={() => handleCreateTab()}
        onPin={handlePinTab}
      />
      <div className="webview-area">
        {(!activeTab || !activeTab.url) ? (
          <NewTabPage
            onNavigate={handleNavigate}
            searchEngine={SEARCH_ENGINES[settings.searchEngine].icon + ' ' + SEARCH_ENGINES[settings.searchEngine].name}
          />
        ) : null}
        {tabs.map((tab) => (
          <WebViewComponent
            key={tab.id}
            ref={(r) => { if (r) wvRefs.current.set(tab.id, r); else wvRefs.current.delete(tab.id); }}
            tabId={tab.id}
            src={tab.url}
            partition={tab.partitionKey}
            active={tab.id === activeTabId}
            preloadPath={preloadPath}
            onTitleChange={(title) => updateTab(tab.id, { title })}
            onFaviconChange={(favicon) => updateTab(tab.id, { favicon })}
            onUrlChange={(url) => updateTab(tab.id, { url })}
            onLoadingChange={(loading) => updateTab(tab.id, { isLoading: loading })}
            onNavigateStateChange={(canBack, canForward) => updateTab(tab.id, { canGoBack: canBack, canGoForward: canForward })}
            onNewWindow={handleNewWindow}
          />
        ))}
      </div>
      <StatusBar
        privacyLevel={settings.privacyLevel}
        searchEngine={settings.searchEngine}
        isHttps={activeTab?.url.startsWith('https') ?? false}
      />
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showBookmarks && (
        <BookmarksPanel
          bookmarks={bookmarks}
          onNavigate={(url) => { handleNavigate(url); setShowBookmarks(false); }}
          onRemove={handleRemoveBookmark}
          onClose={() => setShowBookmarks(false)}
        />
      )}
      {showBookmarkEdit && activeTab && (
        <BookmarkEditDialog
          title={existingBookmark?.title || activeTab.title || activeTab.url || ''}
          url={activeTab.url || ''}
          folders={folders}
          initialFolder={existingBookmark?.folder || ''}
          initialShowInBar={existingBookmark?.showInBar ?? false}
          onSave={handleSaveBookmark}
          onRemove={handleDeleteBookmark}
          onClose={() => setShowBookmarkEdit(false)}
          isExisting={isBookmarked}
        />
      )}
    </div>
  );
}
