import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { StoreManager } from './store-manager';
import { PrivacyEngine } from './privacy-engine';
import { TabManager } from './tab-manager';
import { registerIpcHandlers } from './ipc-handlers';

let mainWindow: BrowserWindow | null = null;
let tabManager: TabManager | null = null;

function createWindow(): void {
  const storeManager = new StoreManager();
  const settings = storeManager.getSettings();
  const privacyEngine = new PrivacyEngine(settings);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1e1e2e',
    webPreferences: {
      preload: path.join(__dirname, '..', '..', 'preload', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  tabManager = new TabManager(mainWindow, privacyEngine, settings);
  registerIpcHandlers(tabManager, storeManager, mainWindow);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'renderer', 'index.html'));
  }

  mainWindow.on('resize', () => {
    if (tabManager && mainWindow) {
      const activeId = tabManager.getActiveTabId();
      if (activeId) tabManager.switchTab(activeId);
    }
  });

  mainWindow.on('closed', () => {
    if (tabManager && settings.cleanupOnExit) {
      tabManager.cleanupAll();
    }
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  if (tabManager) {
    tabManager.cleanupAll();
  }
});
