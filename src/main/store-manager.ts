import Store from 'electron-store';
import { safeStorage } from 'electron';
import crypto from 'crypto';
import { BrowserSettings, DEFAULT_SETTINGS } from '../shared/types';

interface StoreSchema {
  settings: string;
  bookmarks: string;
}

export class StoreManager {
  private store: Store<StoreSchema>;
  private encryptionKey: Buffer | null = null;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'privbrowser-data',
      encryptionKey: undefined,
    });
    this.initEncryption();
  }

  private initEncryption(): void {
    if (safeStorage.isEncryptionAvailable()) {
      const existing = this.store.get('settings');
      if (!existing) {
        const buf = safeStorage.encryptString('init');
        this.store.set('settings', buf.toString('base64'));
      }
    } else {
      const key = crypto.pbkdf2Sync('privbrowser-fallback', 'static-salt', 100000, 32, 'sha256');
      this.encryptionKey = key;
    }
  }

  private encrypt(text: string): string {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.encryptString(text).toString('base64');
    }
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey!, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return JSON.stringify({
      iv: iv.toString('base64'),
      data: encrypted.toString('base64'),
      tag: tag.toString('base64'),
    });
  }

  private decrypt(encoded: string): string {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(encoded, 'base64'));
    }
    const { iv, data, tag } = JSON.parse(encoded);
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey!,
      Buffer.from(iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(data, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  getSettings(): BrowserSettings {
    try {
      const raw = this.store.get('settings');
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(this.decrypt(raw)) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  setSettings(partial: Partial<BrowserSettings>): BrowserSettings {
    const current = this.getSettings();
    const merged = { ...current, ...partial };
    this.store.set('settings', this.encrypt(JSON.stringify(merged)));
    return merged;
  }

  getBookmarks(): { title: string; url: string }[] {
    try {
      const raw = this.store.get('bookmarks');
      if (!raw) return [];
      return JSON.parse(this.decrypt(raw));
    } catch {
      return [];
    }
  }

  setBookmarks(bookmarks: { title: string; url: string }[]): void {
    this.store.set('bookmarks', this.encrypt(JSON.stringify(bookmarks)));
  }

  isEncryptionAvailable(): boolean {
    return safeStorage.isEncryptionAvailable();
  }
}
