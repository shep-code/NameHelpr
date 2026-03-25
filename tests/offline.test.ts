import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Offline Functionality', () => {
  it('vite config includes workbox globPatterns for static assets', () => {
    const viteConfig = readFileSync(resolve(__dirname, '../vite.config.ts'), 'utf-8');
    expect(viteConfig).toContain('globPatterns');
    expect(viteConfig).toContain('js');
    expect(viteConfig).toContain('css');
    expect(viteConfig).toContain('html');
  });

  it('service worker is configured for auto-update', () => {
    const viteConfig = readFileSync(resolve(__dirname, '../vite.config.ts'), 'utf-8');
    expect(viteConfig).toContain("registerType");
    expect(viteConfig).toContain("autoUpdate");
  });
});
