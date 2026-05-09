import { ipcMain, BrowserWindow } from 'electron';
import * as path from 'path';
import { TabManager } from './tab-manager';
import { StoreManager } from './store-manager';
import { BrowserSettings } from '../shared/types';

export function registerIpcHandlers(
  tabManager: TabManager,
  storeManager: StoreManager,
  mainWindow: BrowserWindow
): void {
  ipcMain.handle('getPreloadPath', () => {
    return `file://${path.join(__dirname, '..', '..', 'preload', 'content.js').replace(/\\/g, '/')}`;
  });
  ipcMain.handle('session:ensure', (_e, partitionKey: string) => {
    tabManager.ensureSession(partitionKey);
  });

  ipcMain.handle('session:clear', (_e, partitionKey: string) => {
    tabManager.removeSession(partitionKey);
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

  ipcMain.handle('window:minimize', () => mainWindow.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow.close());
}
