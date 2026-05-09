import { BrowserView, BrowserWindow, session } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { TabState, BrowserSettings } from '../shared/types';
import { PrivacyEngine } from './privacy-engine';

interface TabEntry {
  state: TabState;
  view: BrowserView | null;
  ses: Electron.Session;
}

export class TabManager {
  private tabs: Map<string, TabEntry> = new Map();
  private activeTabId: string | null = null;
  private window: BrowserWindow;
  private privacyEngine: PrivacyEngine;
  private settings: BrowserSettings;

  constructor(window: BrowserWindow, privacyEngine: PrivacyEngine, settings: BrowserSettings) {
    this.window = window;
    this.privacyEngine = privacyEngine;
    this.settings = settings;
  }

  createTab(url?: string): TabState {
    const id = uuidv4();
    const partitionKey = `persist:tab-${id}`;
    const ses = session.fromPartition(partitionKey);

    this.privacyEngine.attachToSession(ses, id);

    const newTab: TabState = {
      id,
      url: url || '',
      title: 'New Tab',
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      blockedCount: 0,
      isPinned: false,
      partitionKey,
    };

    const entry: TabEntry = { state: newTab, view: null, ses };
    this.tabs.set(id, entry);

    if (url) {
      this.ensureView(entry);
      this.navigate(id, url);
      this.switchTab(id);
    } else {
      this.switchTab(id);
      this.notifyTabUpdate(id);
    }

    this.notifyTabCreated(id);
    return newTab;
  }

  private ensureView(entry: TabEntry): void {
    if (entry.view) return;

    const view = new BrowserView({
      webPreferences: {
        partition: entry.state.partitionKey,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
      },
    });

    entry.view = view;
    this.setupViewEvents(view, entry.state.id);
  }

  private setupViewEvents(view: BrowserView, tabId: string): void {
    const wc = view.webContents;

    this.privacyEngine.injectFingerprintProtection(wc);

    wc.setWindowOpenHandler(({ url }) => {
      this.createTab(url);
      return { action: 'deny' };
    });

    wc.on('page-title-updated', (_e, title) => {
      const entry = this.tabs.get(tabId);
      if (entry) {
        entry.state.title = title;
        this.notifyTabUpdate(tabId);
      }
    });

    wc.on('did-start-loading', () => {
      const entry = this.tabs.get(tabId);
      if (entry) {
        entry.state.isLoading = true;
        this.notifyTabUpdate(tabId);
      }
    });

    wc.on('did-stop-loading', () => {
      const entry = this.tabs.get(tabId);
      if (entry) {
        entry.state.isLoading = false;
        entry.state.url = wc.getURL();
        entry.state.canGoBack = wc.canGoBack();
        entry.state.canGoForward = wc.canGoForward();
        this.notifyTabUpdate(tabId);
      }
    });

    wc.on('did-navigate', (_e, url) => {
      const entry = this.tabs.get(tabId);
      if (entry) {
        entry.state.url = url;
        this.notifyTabUpdate(tabId);
      }
    });

    wc.on('render-process-gone', () => {
      const entry = this.tabs.get(tabId);
      if (entry) {
        this.recreateView(entry);
      }
    });
  }

  private recreateView(entry: TabEntry): void {
    const oldView = entry.view;
    if (oldView) {
      this.window.removeBrowserView(oldView);
      (oldView as any).webContents.destroy?.();
    }
    const newView = new BrowserView({
      webPreferences: {
        partition: entry.state.partitionKey,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
      },
    });
    entry.view = newView;
    this.setupViewEvents(newView, entry.state.id);
    newView.webContents.loadURL(entry.state.url);
    this.window.addBrowserView(newView);
    this.setBounds(newView);
    if (this.activeTabId === entry.state.id) {
      this.setViewVisible(newView);
    } else {
      this.setViewHidden(newView);
    }
  }

  updateActiveBounds(): void {
    if (this.activeTabId) {
      const entry = this.tabs.get(this.activeTabId);
      if (entry?.view) this.setBounds(entry.view);
    }
  }

  switchTab(tabId: string): void {
    if (this.activeTabId === tabId) {
      this.updateActiveBounds();
      return;
    }
    const prevEntry = this.activeTabId ? this.tabs.get(this.activeTabId) : null;
    if (prevEntry && prevEntry.view) this.setViewHidden(prevEntry.view);

    const entry = this.tabs.get(tabId);
    if (!entry) return;

    this.activeTabId = tabId;
    if (entry.view) {
      this.setViewVisible(entry.view);
      this.setBounds(entry.view);
    }
    this.notifyTabUpdate(tabId);
  }

  closeTab(tabId: string): void {
    const entry = this.tabs.get(tabId);
    if (!entry) return;

    if (!entry.state.isPinned) {
      this.clearPartitionData(entry);
    }

    if (entry.view) {
      this.window.removeBrowserView(entry.view);
      (entry.view as any).webContents.destroy?.();
    }

    this.tabs.delete(tabId);

    if (this.activeTabId === tabId) {
      const remaining = Array.from(this.tabs.keys());
      if (remaining.length > 0) {
        this.switchTab(remaining[remaining.length - 1]);
      } else {
        this.activeTabId = null;
        this.createTab();
      }
    }
  }

  private async clearPartitionData(entry: TabEntry): Promise<void> {
    try {
      await entry.ses.clearStorageData({
        storages: [
          'cookies', 'filesystem', 'indexdb', 'localstorage',
          'shadercache', 'websql', 'serviceworkers', 'cachestorage',
        ],
      });
      await entry.ses.clearCache();
      await entry.ses.clearHostResolverCache();
    } catch {}
  }

  navigate(tabId: string, rawUrl: string): void {
    const entry = this.tabs.get(tabId);
    if (!entry) return;

    const url = this.privacyEngine.autoUpgradeHttps(rawUrl);
    entry.state.url = url;
    entry.state.isLoading = true;

    this.ensureView(entry);
    this.window.addBrowserView(entry.view!);
    this.setBounds(entry.view!);
    this.switchTab(tabId);

    entry.view!.webContents.loadURL(url);
    this.notifyTabUpdate(tabId);
  }

  goBack(tabId: string): void {
    const entry = this.tabs.get(tabId);
    if (entry?.view?.webContents.canGoBack()) {
      entry.view.webContents.goBack();
    }
  }

  goForward(tabId: string): void {
    const entry = this.tabs.get(tabId);
    if (entry?.view?.webContents.canGoForward()) {
      entry.view.webContents.goForward();
    }
  }

  reload(tabId: string): void {
    const entry = this.tabs.get(tabId);
    if (entry?.view) entry.view.webContents.reload();
  }

  stopLoading(tabId: string): void {
    const entry = this.tabs.get(tabId);
    if (entry?.view) entry.view.webContents.stop();
  }

  togglePin(tabId: string): void {
    const entry = this.tabs.get(tabId);
    if (entry) {
      entry.state.isPinned = !entry.state.isPinned;
      this.notifyTabUpdate(tabId);
    }
  }

  getTabState(tabId: string): TabState | null {
    return this.tabs.get(tabId)?.state ?? null;
  }

  getAllTabs(): TabState[] {
    return Array.from(this.tabs.values()).map((e) => ({ ...e.state }));
  }

  cleanupAll(): void {
    for (const [, entry] of this.tabs) {
      if (!entry.state.isPinned) {
        this.clearPartitionData(entry);
      }
    }
  }

  suspendInactive(): void {
    const maxActive = this.settings.maxActiveTabs;
    const entries = Array.from(this.tabs.entries());
    let activeCount = 0;
    for (const [id, entry] of entries) {
      if (id === this.activeTabId) {
        activeCount++;
      } else if (activeCount < maxActive) {
        activeCount++;
      } else {
        if (entry.view) {
          this.window.removeBrowserView(entry.view);
          (entry.view as any).webContents.destroy?.();
          entry.view = null;
        }
      }
    }
  }

  setBounds(view: BrowserView): void {
    const contentBounds = this.window.getContentBounds();
    view.setBounds({
      x: 0,
      y: 134,
      width: contentBounds.width,
      height: contentBounds.height - 158,
    });
  }

  private setViewVisible(view: BrowserView): void {
    view.setBounds({
      x: 0,
      y: 134,
      width: this.window.getContentBounds().width,
      height: this.window.getContentBounds().height - 104,
    });
  }

  private setViewHidden(view: BrowserView): void {
    view.setBounds({ x: -9999, y: -9999, width: 1, height: 1 });
  }

  private notifyTabUpdate(tabId: string): void {
    const state = this.getTabState(tabId);
    if (state) {
      this.window.webContents.send('tab:updated', state);
    }
  }

  private notifyTabCreated(tabId: string): void {
    const state = this.getTabState(tabId);
    if (state) {
      this.window.webContents.send('tab:created', state);
    }
  }

  getActiveTabId(): string | null {
    return this.activeTabId;
  }

  hideActiveView(): void {
    if (this.activeTabId) {
      const entry = this.tabs.get(this.activeTabId);
      if (entry?.view) this.setViewHidden(entry.view);
    }
  }

  showActiveView(): void {
    if (this.activeTabId) {
      const entry = this.tabs.get(this.activeTabId);
      if (entry?.view) {
        this.setViewVisible(entry.view);
        this.setBounds(entry.view);
      }
    }
  }

  updateSettings(settings: BrowserSettings): void {
    this.settings = settings;
    this.privacyEngine.updateSettings(settings);
  }
}
