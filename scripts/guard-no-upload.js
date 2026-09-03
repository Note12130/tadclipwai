/**
 * guard-no-upload.js
 * CI/Lint guard that scans the codebase to ensure NO video or audio media bytes
 * are ever sent via fetch/XHR/sendBeacon to any server endpoint.
 * Enforces Zero-Storage / Client-Only guarantee.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Suspicious patterns that indicate media upload attempts
const FORBIDDEN_PATTERNS = [
  {
    regex: /(?:fetch|axios(?:\.post|\.put)?|XMLHttpRequest|\.send\b|sendBeacon)\s*\([^)]*(?:video\/|audio\/|Blob|File|ArrayBuffer)[^)]*\)/i,
    description: 'Direct call sending media data via network request',
  },
  {
    regex: /headers:\s*\{[^}]*Content-Type['"]?\s*:\s*['"](?:video|audio)\/[^'"]+['"][^}]*\}/i,
    description: 'Network request header specifying video/* or audio/* MIME type',
  },
  {
    regex: /formData\.append\s*\(\s*['"][^'"]*['"]\s*,\s*(?:video|audio|blob|file|chunk)[^)]*\)/i,
    description: 'Appending media file/blob to FormData for network transfer',
  },
];

// Whitelist patterns (e.g. comments, error messages, guard tests)
const ALLOWED_FILES = [
  'scripts/guard-no-upload.js',
  'scripts/guard-no-upload.test.js',
];

export function scanContent(content, filePath = '') {
  const violations = [];
  const lines = content.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    // Skip single-line comments and empty lines
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.regex.test(line)) {
        violations.push({
          file: filePath,
          line: lineIndex + 1,
          content: line.trim(),
          reason: pattern.description,
        });
      }
    }
  }

  return violations;
}

export function scanDirectory(dirPath, projectRoot) {
  let violations = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(projectRoot, fullPath);

    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'e2e', 'test-results', 'ai'].includes(entry.name)) {
        continue;
      }
      violations = violations.concat(scanDirectory(fullPath, projectRoot));
    } else if (entry.isFile()) {
      if (ALLOWED_FILES.some(allowed => relPath.endsWith(allowed))) {
        continue;
      }
      if (/\.(jsx?|tsx?|mjs|cjs)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        violations = violations.concat(scanContent(content, relPath));
      }
    }
  }

  return violations;
}

export function runGuard(srcDir, projectRoot) {
  const violations = scanDirectory(srcDir, projectRoot);
  if (violations.length > 0) {
    console.error('\x1b[31m[GUARD VIOLATION] Security/Privacy Rule Triggered:\x1b[0m');
    console.error('Found potential media upload calls sending video/audio data over the network:');
    for (const v of violations) {
      console.error(`  --> \x1b[33m${v.file}:${v.line}\x1b[0m: ${v.reason}`);
      console.error(`      \x1b[90m${v.content}\x1b[0m`);
    }
    console.error('\nZero-Storage policy requires all processing to stay local in browser.');
    return false;
  }
  console.log('\x1b[32m[GUARD PASSED]\x1b[0m No video/audio upload calls detected. Zero-Storage policy verified.');
  return true;
}

// If executed directly from CLI
const isDirectCall = process.argv[1] && (
  process.argv[1] === __filename ||
  process.argv[1].endsWith('guard-no-upload.js')
);

if (isDirectCall) {
  const projectRoot = path.resolve(__dirname, '..');
  const srcDir = path.join(projectRoot, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.log('[GUARD] src/ does not exist yet. Skipping check.');
    process.exit(0);
  }

  const ok = runGuard(srcDir, projectRoot);
  if (!ok) {
    process.exit(1);
  }
}
