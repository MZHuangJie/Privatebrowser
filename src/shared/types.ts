export interface TabState {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  blockedCount: number;
  isPinned: boolean;
  partitionKey: string;
}

export type PrivacyLevel = 'strict' | 'balanced' | 'relaxed';

export type ThemeMode = 'dark' | 'light' | 'midnight' | 'forest' | 'sunset' | 'ocean' | 'lavender' | 'system';

export type SearchEngine = 'google' | 'duckduckgo' | 'bing' | 'baidu' | 'searxng';

export interface SearchEngineDef {
  name: string;
  searchUrl: string;
  icon: string;
}

export const SEARCH_ENGINES: Record<SearchEngine, SearchEngineDef> = {
  google:     { name: 'Google',     searchUrl: 'https://www.google.com/search?q=%s',     icon: '🔍' },
  duckduckgo: { name: 'DuckDuckGo', searchUrl: 'https://duckduckgo.com/?q=%s',          icon: '🦆' },
  bing:       { name: 'Bing',       searchUrl: 'https://www.bing.com/search?q=%s',       icon: '🔵' },
  baidu:      { name: 'Baidu',      searchUrl: 'https://www.baidu.com/s?wd=%s',          icon: '🐾' },
  searxng:    { name: 'SearXNG',    searchUrl: 'http://localhost:8080/search?q=%s',      icon: '🧅' },
};

export interface BrowserSettings {
  privacyLevel: PrivacyLevel;
  searchEngine: SearchEngine;
  theme: ThemeMode;
  enableAutoCleanup: boolean;
  cleanupOnExit: boolean;
  cleanupTimerMinutes: number;
  blockTrackers: boolean;
  blockFingerprinting: boolean;
  httpsOnly: boolean;
  maxActiveTabs: number;
  whitelist: string[];
}

export const DEFAULT_SETTINGS: BrowserSettings = {
  privacyLevel: 'strict',
  searchEngine: 'google',
  theme: 'dark',
  enableAutoCleanup: true,
  cleanupOnExit: true,
  cleanupTimerMinutes: 0,
  blockTrackers: true,
  blockFingerprinting: true,
  httpsOnly: true,
  maxActiveTabs: 5,
  whitelist: [],
};

export interface IpcChannels {
  'tab:create': () => string;
  'tab:close': (tabId: string) => void;
  'tab:switch': (tabId: string) => void;
  'tab:update': (tabId: string) => void;
  'nav:go': (payload: { tabId: string; url: string }) => void;
  'nav:back': (tabId: string) => void;
  'nav:forward': (tabId: string) => void;
  'nav:reload': (tabId: string) => void;
  'settings:get': () => BrowserSettings;
  'settings:set': (settings: Partial<BrowserSettings>) => void;
  'tabs:getAll': () => TabState[];
  'tab:pin': (tabId: string) => void;
  'tab:unpin': (tabId: string) => void;
}
