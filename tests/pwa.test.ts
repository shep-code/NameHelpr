import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('PWA Infrastructure', () => {
  it('manifest includes correct app name', () => {
    const viteConfig = readFileSync(resolve(__dirname, '../vite.config.ts'), 'utf-8');
    expect(viteConfig).toContain("name: 'NameHelpr'");
  });

  it('manifest includes 192x192 icon', () => {
    const iconPath = resolve(__dirname, '../public/icons/192.png');
    expect(existsSync(iconPath)).toBe(true);
  });

  it('manifest includes 512x512 icon', () => {
    const iconPath = resolve(__dirname, '../public/icons/512.png');
    expect(existsSync(iconPath)).toBe(true);
  });

  it('vite config has PWA plugin configured', () => {
    const viteConfig = readFileSync(resolve(__dirname, '../vite.config.ts'), 'utf-8');
    expect(viteConfig).toContain('VitePWA');
    expect(viteConfig).toContain('registerType');
  });
});
