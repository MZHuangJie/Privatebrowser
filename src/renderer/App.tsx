import React, { useState, useEffect, useCallback } from 'react';
import { TabState, BrowserSettings, DEFAULT_SETTINGS, ThemeMode, SEARCH_ENGINES } from '../shared/types';
import TabBar from './components/TabBar';
import AddressBar from './components/AddressBar';
import ToolBar from './components/ToolBar';
import StatusBar from './components/StatusBar';
import SettingsPanel from './components/SettingsPanel';
import NewTabPage from './components/NewTabPage';
import BookmarksPanel from './components/BookmarksPanel';
import BookmarksBar from './components/BookmarksBar';
import BookmarkEditDialog, { Bookmark } from './components/BookmarkEditDialog';

export default function App() {
  const [tabs, setTabs] = useState<TabState[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [settings, setSettings] = useState<BrowserSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showBookmarkEdit, setShowBookmarkEdit] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [theme, setTheme] = useState<ThemeMode>('dark');

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  const themeCycle: ThemeMode[] = ['dark', 'midnight', 'forest', 'sunset', 'ocean', 'lavender', 'light'];

  useEffect(() => {
    window.privbrowser.settings.get().then((s) => {
      setSettings(s);
      applyTheme(s.theme);
    });
    window.privbrowser.bookmarks.get().then(setBookmarks);
    window.privbrowser.tabs.onUpdate((updated) => {
      setTabs((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    });
    window.privbrowser.tabs.onCreated((created) => {
      setTabs((prev) => {
        if (prev.some((t) => t.id === created.id)) return prev;
        return [...prev, created];
      });
      setActiveTabId(created.id);
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
    let tabId = activeTabId;
    if (!tabId) {
      const tab = await window.privbrowser.tabs.create();
      setTabs((prev) => [...prev, tab]);
      setActiveTabId(tab.id);
      tabId = tab.id;
    }
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
    await window.privbrowser.nav.go(tabId, finalUrl);
  }, [activeTabId, settings.searchEngine]);

  const existingBookmark = activeTab?.url ? bookmarks.find((b) => b.url === activeTab.url) : null;
  const isBookmarked = !!existingBookmark;

  const handleToggleBookmark = useCallback(() => {
    if (!activeTab?.url || activeTab.url === 'about:blank') return;
    window.privbrowser.tabs.hideActive();
    setShowBookmarkEdit(true);
  }, [activeTab]);

  const folders = [...new Set(bookmarks.map((b) => b.folder).filter(Boolean))] as string[];

  const handleSaveBookmark = useCallback(async (bm: Bookmark) => {
    if (existingBookmark) {
      await window.privbrowser.bookmarks.remove(activeTab!.url);
    }
    await window.privbrowser.bookmarks.add(bm);
    const updated = await window.privbrowser.bookmarks.get();
    setBookmarks(updated);
    setShowBookmarkEdit(false);
    window.privbrowser.tabs.showActive();
  }, [existingBookmark, activeTab]);

  const handleDeleteBookmark = useCallback(async () => {
    if (activeTab?.url) {
      const updated = await window.privbrowser.bookmarks.remove(activeTab.url);
      setBookmarks(updated);
    }
    setShowBookmarkEdit(false);
    window.privbrowser.tabs.showActive();
  }, [activeTab]);

  const handleRemoveBookmark = useCallback(async (url: string) => {
    const updated = await window.privbrowser.bookmarks.remove(url);
    setBookmarks(updated);
  }, []);

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
        isLoading={activeTab?.isLoading ?? false}
        onBack={() => activeTabId && window.privbrowser.nav.back(activeTabId)}
        onForward={() => activeTabId && window.privbrowser.nav.forward(activeTabId)}
        onStop={() => activeTabId && window.privbrowser.nav.stop(activeTabId)}
        onReload={() => activeTabId && window.privbrowser.nav.reload(activeTabId)}
        theme={theme}
        onToggleTheme={() => {
          const idx = themeCycle.indexOf(theme === 'system' ? 'dark' : theme);
          const next = themeCycle[(idx + 1) % themeCycle.length];
          handleSettingsChange({ theme: next });
        }}
        onOpenBookmarks={() => {
          setShowBookmarks((v) => {
            if (!v) window.privbrowser.tabs.hideActive();
            else window.privbrowser.tabs.showActive();
            return !v;
          });
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
        onPin={(tabId) => window.privbrowser.tabs.pin(tabId)}
      />
      {(!activeTab || !activeTab.url) ? (
        <NewTabPage
          onNavigate={handleNavigate}
          searchEngine={SEARCH_ENGINES[settings.searchEngine].icon + ' ' + SEARCH_ENGINES[settings.searchEngine].name}
        />
      ) : null}
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
      {showBookmarks && (
        <BookmarksPanel
          bookmarks={bookmarks}
          onNavigate={(url) => {
            handleNavigate(url);
            setShowBookmarks(false);
            window.privbrowser.tabs.showActive();
          }}
          onRemove={handleRemoveBookmark}
          onClose={() => {
            window.privbrowser.tabs.showActive();
            setShowBookmarks(false);
          }}
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
