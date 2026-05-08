import { Session, session, webContents } from 'electron';
import { PrivacyLevel, BrowserSettings } from '../shared/types';
import * as fs from 'fs';
import * as path from 'path';

const FINGERPRINT_SCRIPT = `
(function() {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(...args) {
    const ctx = originalGetContext.apply(this, args);
    if (args[0] === '2d' && ctx) {
      const originalGetImageData = ctx.getImageData;
      ctx.getImageData = function(...gArgs) {
        const data = originalGetImageData.apply(this, gArgs);
        for (let i = 0; i < data.data.length; i += 4) {
          data.data[i] = data.data[i] ^ (Math.random() < 0.5 ? 1 : 0);
        }
        return data;
      };
    }
    return ctx;
  };

  if (navigator.__defineGetter__) {
    navigator.__defineGetter__('plugins', () => []);
    navigator.__defineGetter__('mimeTypes', () => []);
  }

  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
  Object.defineProperty(navigator, 'deviceMemory', { get: () => 4 });

  const origRTC = window.RTCPeerConnection;
  if (origRTC) {
    window.RTCPeerConnection = function(...args) {
      const pc = new origRTC(...args);
      const origCreate = pc.createDataChannel;
      pc.createDataChannel = function(...dcArgs) {
        return origCreate.apply(pc, dcArgs);
      };
      return pc;
    };
  }
})();
`;

export class PrivacyEngine {
  private rulePatterns: string[] = [];
  private settings: BrowserSettings;

  constructor(settings: BrowserSettings) {
    this.settings = settings;
    this.loadRules();
  }

  updateSettings(settings: BrowserSettings): void {
    this.settings = settings;
  }

  private loadRules(): void {
    const rulesDir = path.join(__dirname, 'tracker-rules');
    try {
      const easyList = fs.readFileSync(path.join(rulesDir, 'easylist.txt'), 'utf8');
      const easyPrivacy = fs.readFileSync(path.join(rulesDir, 'easyprivacy.txt'), 'utf8');
      this.rulePatterns = [...easyList.split('\n'), ...easyPrivacy.split('\n')]
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('!') && !l.startsWith('['));
    } catch {
      this.rulePatterns = [];
    }
  }

  matchesTracker(url: string): boolean {
    if (this.settings.privacyLevel === 'relaxed') return false;
    const isInWhitelist = this.settings.whitelist.some((w) => url.includes(w));
    if (isInWhitelist) return false;
    return this.rulePatterns.some((pattern) => {
      if (pattern.startsWith('||')) {
        const domain = pattern.slice(2);
        return url.includes(domain);
      }
      return url.includes(pattern);
    });
  }

  attachToSession(ses: Session, tabId: string): void {
    if (!this.settings.blockTrackers) return;

    ses.webRequest.onBeforeRequest(
      { urls: ['<all_urls>'] },
      (details, callback) => {
        if (this.matchesTracker(details.url)) {
          callback({ cancel: true });
        } else {
          callback({});
        }
      }
    );

    ses.webRequest.onBeforeSendHeaders(
      { urls: ['<all_urls>'] },
      (details, callback) => {
        delete details.requestHeaders['X-Client-Data'];
        details.requestHeaders['User-Agent'] =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
        callback({ requestHeaders: details.requestHeaders });
      }
    );
  }

  injectFingerprintProtection(wc: Electron.WebContents): void {
    if (!this.settings.blockFingerprinting) return;
    if (this.settings.privacyLevel === 'relaxed') return;

    wc.on('did-finish-load', () => {
      wc.executeJavaScript(FINGERPRINT_SCRIPT).catch(() => {});
    });
  }

  autoUpgradeHttps(url: string): string {
    if (this.settings.httpsOnly && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  }

  getBlockedCount(ses: Session): number {
    return 0;
  }
}
