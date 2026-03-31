#!/usr/bin/env node
/**
 * Patches next/dist/export/worker.js to handle the _global-error prerender bug
 * in Next.js 16.2.1 + Turbopack. During static generation, _global-error triggers
 * a TypeError (React module null) that normally aborts the build. This patch:
 *   1. Converts the uncaught TypeError to ExportPageError (so it enters retry logic)
 *   2. Resets result=undefined so _global-error is silently skipped (not counted as failure)
 *
 * Combined with `experimental.prerenderEarlyExit: false` in next.config.ts,
 * the build completes successfully despite the _global-error prerender failure.
 */

const fs = require('fs');
const path = require('path');

// Search common locations for the Next.js worker.js file
const candidates = [
  // pnpm: next is installed in apps/web/node_modules/next (symlink to pnpm store)
  path.resolve(__dirname, '../apps/web/node_modules/next/dist/export/worker.js'),
  // fallback: direct pnpm store path pattern
  ...(() => {
    try {
      const pnpmStore = path.resolve(__dirname, '../node_modules/.pnpm');
      if (!fs.existsSync(pnpmStore)) return [];
      const dirs = fs.readdirSync(pnpmStore).filter(d => d.startsWith('next@'));
      return dirs.map(d => path.join(pnpmStore, d, 'node_modules/next/dist/export/worker.js'));
    } catch { return []; }
  })(),
];

let NEXT_WORKER = null;
for (const candidate of candidates) {
  try {
    const real = fs.realpathSync(candidate);
    if (fs.existsSync(real)) {
      NEXT_WORKER = real;
      break;
    }
  } catch {}
}

if (!NEXT_WORKER) {
  console.log('[patch-next] worker.js not found in any candidate path, skipping patch');
  process.exit(0);
}

console.log('[patch-next] Patching:', NEXT_WORKER);
let content = fs.readFileSync(NEXT_WORKER, 'utf8');
let changed = false;

// Patch 1: Convert uncaught TypeError to ExportPageError
const OLD1 = 'if (!(err instanceof ExportPageError || err instanceof TimeoutError)) {\n                    throw err;\n                }';
const NEW1 = 'if (!(err instanceof ExportPageError || err instanceof TimeoutError)) {\n                    throw new ExportPageError();\n                }';
if (content.includes(OLD1)) {
  content = content.replace(OLD1, NEW1);
  changed = true;
  console.log('[patch-next] Applied patch 1: TypeError -> ExportPageError');
} else if (content.includes(NEW1)) {
  console.log('[patch-next] Patch 1 already applied');
} else {
  console.warn('[patch-next] WARNING: Patch 1 target not found (Next.js version may differ)');
}

// Patch 2: Reset result=undefined in the no-op else branch so _global-error is skipped
const OLD2 = '} else {\n                    // Otherwise, this is a no-op. The build will continue, and a summary of failed pages will be displayed at the end.\n                    }';
const NEW2 = '} else {\n                    // Otherwise, this is a no-op. The build will continue, and a summary of failed pages will be displayed at the end.\n                    result = undefined;\n                    }';
if (content.includes(OLD2)) {
  content = content.replace(OLD2, NEW2);
  changed = true;
  console.log('[patch-next] Applied patch 2: result=undefined on silent failure');
} else if (content.includes(NEW2)) {
  console.log('[patch-next] Patch 2 already applied');
} else {
  console.warn('[patch-next] WARNING: Patch 2 target not found (Next.js version may differ)');
}

if (changed) {
  fs.writeFileSync(NEXT_WORKER, content);
  console.log('[patch-next] worker.js patched successfully');
} else {
  console.log('[patch-next] No changes needed');
}
