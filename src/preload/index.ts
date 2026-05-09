import { contextBridge, ipcRenderer } from 'electron';
import { BrowserSettings } from '../shared/types';

const api = {
  session: {
    ensure: (partitionKey: string): Promise<void> => ipcRenderer.invoke('session:ensure', partitionKey),
    clear: (partitionKey: string): Promise<void> => ipcRenderer.invoke('session:clear', partitionKey),
  },

  settings: {
    get: (): Promise<BrowserSettings> => ipcRenderer.invoke('settings:get'),
    set: (partial: Partial<BrowserSettings>): Promise<BrowserSettings> =>
      ipcRenderer.invoke('settings:set', partial),
  },

  bookmarks: {
    get: (): Promise<{ title: string; url: string; folder: string; showInBar: boolean }[]> =>
      ipcRenderer.invoke('bookmarks:get'),
    add: (bookmark: { title: string; url: string; folder?: string; showInBar?: boolean }) =>
      ipcRenderer.invoke('bookmarks:add', bookmark),
    remove: (url: string) =>
      ipcRenderer.invoke('bookmarks:remove', url),
  },

  getPreloadPath: (): Promise<string> => ipcRenderer.invoke('getPreloadPath'),

  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    maximize: (): Promise<void> => ipcRenderer.invoke('window:maximize'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close'),
  },
};

contextBridge.exposeInMainWorld('privbrowser', api);

export type PrivBrowserApi = typeof api;
