import { contextBridge, ipcRenderer } from 'electron';
import { TabState, BrowserSettings } from '../shared/types';

const api = {
  tabs: {
    create: (url?: string): Promise<TabState> => ipcRenderer.invoke('tab:create', url),
    close: (tabId: string): Promise<void> => ipcRenderer.invoke('tab:close', tabId),
    switch: (tabId: string): Promise<void> => ipcRenderer.invoke('tab:switch', tabId),
    pin: (tabId: string): Promise<void> => ipcRenderer.invoke('tab:pin', tabId),
    getAll: (): Promise<TabState[]> => ipcRenderer.invoke('tabs:getAll'),
    hideActive: (): Promise<void> => ipcRenderer.invoke('tab:hideActive'),
    showActive: (): Promise<void> => ipcRenderer.invoke('tab:showActive'),
    onUpdate: (callback: (tab: TabState) => void) => {
      ipcRenderer.on('tab:updated', (_e, tab: TabState) => callback(tab));
      return () => {
        ipcRenderer.removeAllListeners('tab:updated');
      };
    },
    onCreated: (callback: (tab: TabState) => void) => {
      ipcRenderer.on('tab:created', (_e, tab: TabState) => callback(tab));
      return () => {
        ipcRenderer.removeAllListeners('tab:created');
      };
    },
  },

  nav: {
    go: (tabId: string, url: string): Promise<void> =>
      ipcRenderer.invoke('nav:go', { tabId, url }),
    back: (tabId: string): Promise<void> => ipcRenderer.invoke('nav:back', tabId),
    forward: (tabId: string): Promise<void> => ipcRenderer.invoke('nav:forward', tabId),
    reload: (tabId: string): Promise<void> => ipcRenderer.invoke('nav:reload', tabId),
    stop: (tabId: string): Promise<void> => ipcRenderer.invoke('nav:stop', tabId),
  },

  settings: {
    get: (): Promise<BrowserSettings> => ipcRenderer.invoke('settings:get'),
    set: (partial: Partial<BrowserSettings>): Promise<BrowserSettings> =>
      ipcRenderer.invoke('settings:set', partial),
  },

  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    maximize: (): Promise<void> => ipcRenderer.invoke('window:maximize'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close'),
  },

  bookmarks: {
    get: (): Promise<{ title: string; url: string }[]> =>
      ipcRenderer.invoke('bookmarks:get'),
    add: (bookmark: { title: string; url: string; folder?: string; showInBar?: boolean }) =>
      ipcRenderer.invoke('bookmarks:add', bookmark),
    remove: (url: string) =>
      ipcRenderer.invoke('bookmarks:remove', url),
  },
};

contextBridge.exposeInMainWorld('privbrowser', api);

export type PrivBrowserApi = typeof api;
