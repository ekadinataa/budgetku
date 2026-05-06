import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve project root (budgetku/) from this test file location
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..', '..', '..');

function readConfig(filename) {
  return readFileSync(resolve(projectRoot, filename), 'utf-8');
}

function readJsonConfig(filename) {
  return JSON.parse(readConfig(filename));
}

// ── .firebaserc ─────────────────────────────────────────────────────────────
// Validates: Requirements 1.2

describe('.firebaserc', () => {
  it('has projects.default set to budgetku-app-v1', () => {
    const rc = readJsonConfig('.firebaserc');
    expect(rc.projects.default).toBe('budgetku-app-v1');
  });
});

// ── firebase.json ───────────────────────────────────────────────────────────
// Validates: Requirements 3.3, 3.4, 3.5, 7.1, 7.3

describe('firebase.json', () => {
  const config = readJsonConfig('firebase.json');

  it('has hosting.public set to "dist"', () => {
    expect(config.hosting.public).toBe('dist');
  });

  it('does NOT have a functions key (Spark plan compliance)', () => {
    expect(config).not.toHaveProperty('functions');
  });

  it('has the SPA rewrite rule (** → /index.html)', () => {
    const rewrites = config.hosting.rewrites;
    expect(rewrites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: '**', destination: '/index.html' }),
      ]),
    );
  });

  it('has immutable cache headers for /assets/**', () => {
    const headers = config.hosting.headers;
    const assetsRule = headers.find((h) => h.source === '/assets/**');
    expect(assetsRule).toBeDefined();

    const cacheHeader = assetsRule.headers.find(
      (h) => h.key === 'Cache-Control',
    );
    expect(cacheHeader).toBeDefined();
    expect(cacheHeader.value).toContain('immutable');
    expect(cacheHeader.value).toContain('max-age=31536000');
  });
});

// ── firestore.rules ─────────────────────────────────────────────────────────
// Validates: Requirements 4.2, 4.3

describe('firestore.rules', () => {
  const rules = readConfig('firestore.rules');

  it('contains the global deny rule', () => {
    expect(rules).toContain('allow read, write: if false');
  });

  it('contains the per-user isolation rule', () => {
    expect(rules).toContain('match /users/{userId}/{document=**}');
    expect(rules).toContain('request.auth.uid == userId');
  });
});
