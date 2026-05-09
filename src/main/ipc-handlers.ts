import { ipcMain, BrowserWindow } from 'electron';
import { TabManager } from './tab-manager';
import { StoreManager } from './store-manager';
import { BrowserSettings } from '../shared/types';

export function registerIpcHandlers(
  tabManager: TabManager,
  storeManager: StoreManager,
  mainWindow: BrowserWindow
): void {
  ipcMain.handle('tab:create', (_e, url?: string) => {
    return tabManager.createTab(url);
  });

  ipcMain.handle('tab:close', (_e, tabId: string) => {
    tabManager.closeTab(tabId);
  });

  ipcMain.handle('tab:switch', (_e, tabId: string) => {
    tabManager.switchTab(tabId);
  });

  ipcMain.handle('tab:pin', (_e, tabId: string) => {
    tabManager.togglePin(tabId);
  });

  ipcMain.handle('nav:go', (_e, payload: { tabId: string; url: string }) => {
    tabManager.navigate(payload.tabId, payload.url);
  });

  ipcMain.handle('nav:back', (_e, tabId: string) => {
    tabManager.goBack(tabId);
  });

  ipcMain.handle('nav:forward', (_e, tabId: string) => {
    tabManager.goForward(tabId);
  });

  ipcMain.handle('nav:reload', (_e, tabId: string) => {
    tabManager.reload(tabId);
  });

  ipcMain.handle('nav:stop', (_e, tabId: string) => {
    tabManager.stopLoading(tabId);
  });

  ipcMain.handle('tabs:getAll', () => {
    return tabManager.getAllTabs();
  });

  ipcMain.handle('tab:hideActive', () => {
    tabManager.hideActiveView();
  });

  ipcMain.handle('tab:showActive', () => {
    tabManager.showActiveView();
  });

  ipcMain.handle('settings:get', () => {
    return storeManager.getSettings();
  });

  ipcMain.handle('settings:set', (_e, partial: Partial<BrowserSettings>) => {
    const settings = storeManager.setSettings(partial);
    tabManager.updateSettings(settings);
    return settings;
  });

  ipcMain.handle('bookmarks:get', () => {
    return storeManager.getBookmarks();
  });

  ipcMain.handle('bookmarks:add', (_e, bookmark: { title: string; url: string; folder?: string; showInBar?: boolean }) => {
    const bookmarks = storeManager.getBookmarks();
    const idx = bookmarks.findIndex((b) => b.url === bookmark.url);
    const entry = {
      title: bookmark.title,
      url: bookmark.url,
      folder: bookmark.folder || '',
      showInBar: bookmark.showInBar ?? false,
    };
    if (idx >= 0) {
      bookmarks[idx] = entry;
    } else {
      bookmarks.push(entry);
    }
    storeManager.setBookmarks(bookmarks);
    return bookmarks;
  });

  ipcMain.handle('bookmarks:remove', (_e, url: string) => {
    storeManager.removeBookmark(url);
    return storeManager.getBookmarks();
  });

  ipcMain.handle('window:minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow.close();
  });
}
