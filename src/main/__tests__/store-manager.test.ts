import { describe, it, expect } from 'vitest';

describe('StoreManager', () => {
  it('should return default settings when no stored data', () => {
    const defaults = {
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
    expect(defaults.privacyLevel).toBe('strict');
    expect(defaults.searchEngine).toBe('google');
  });
});
