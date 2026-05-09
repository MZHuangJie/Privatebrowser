import { session } from 'electron';
import { PrivacyEngine } from './privacy-engine';

export class TabManager {
  private privacyEngine: PrivacyEngine;
  private sessions: Set<string> = new Set();

  constructor(privacyEngine: PrivacyEngine) {
    this.privacyEngine = privacyEngine;
  }

  ensureSession(partitionKey: string): void {
    if (this.sessions.has(partitionKey)) return;
    this.sessions.add(partitionKey);
    const ses = session.fromPartition(partitionKey);
    this.privacyEngine.attachToSession(ses);
  }

  removeSession(partitionKey: string): void {
    this.sessions.delete(partitionKey);
    try {
      const ses = session.fromPartition(partitionKey);
      ses.clearStorageData({
        storages: ['cookies', 'filesystem', 'indexdb', 'localstorage',
          'shadercache', 'websql', 'serviceworkers', 'cachestorage'],
      });
      ses.clearCache();
      ses.clearHostResolverCache();
    } catch {}
  }

  cleanupAll(): void {
    for (const key of this.sessions) {
      this.removeSession(key);
    }
    this.sessions.clear();
  }

  updateSettings(settings: any): void {
    this.privacyEngine.updateSettings(settings);
  }
}
