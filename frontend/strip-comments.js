/**
 * strip-comments.js
 *
 * Removes all comments from every .ts and .tsx file inside src/.
 * Handles: single-line (//) , block (/* *\/), and JSDoc (/** *\/) comments.
 * Safely skips comment-like sequences that appear inside string literals.
 *
 * Usage:  node strip-comments.js
 */

import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.join(process.cwd(), 'src');
const EXTENSIONS = new Set(['.ts', '.tsx']);

/**
 * Walk a directory recursively and return all matching file paths.
 */
function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Strip all comments from source code using a character-level state machine.
 * This correctly handles:
 *  - Strings (single/double-quoted) — skips their content
 *  - Template literals — skips their content
 *  - Single-line comments   // ...
 *  - Block/JSDoc comments   /* ... *\/
 *
 * @param {string} source - Raw source code text
 * @returns {string} - Cleaned source with all comments removed
 */
function stripComments(source) {
  let result = '';
  let i = 0;
  const len = source.length;

  while (i < len) {
    const ch = source[i];
    const next = source[i + 1];

    // ── Inside a template literal ─────────────────────────────────────────────
    if (ch === '`') {
      result += ch;
      i++;
      while (i < len) {
        const c = source[i];
        result += c;
        i++;
        if (c === '\\') {
          // Escaped character — copy next char as-is and skip
          result += source[i];
          i++;
        } else if (c === '`') {
          break; // End of template literal
        }
      }
      continue;
    }

    // ── Inside a single-quoted string ─────────────────────────────────────────
    if (ch === "'" || ch === '"') {
      const quote = ch;
      result += ch;
      i++;
      while (i < len) {
        const c = source[i];
        result += c;
        i++;
        if (c === '\\') {
          // Escaped character — copy next char and skip
          result += source[i];
          i++;
        } else if (c === quote) {
          break; // End of string
        }
      }
      continue;
    }

    // ── Single-line comment: // ───────────────────────────────────────────────
    if (ch === '/' && next === '/') {
      // Skip all characters until end of line (preserve the newline itself)
      while (i < len && source[i] !== '\n') {
        i++;
      }
      continue;
    }

    // ── Block/JSDoc comment: /* ... */ ────────────────────────────────────────
    if (ch === '/' && next === '*') {
      i += 2; // Skip opening /*
      while (i < len) {
        if (source[i] === '*' && source[i + 1] === '/') {
          i += 2; // Skip closing */
          break;
        }
        i++;
      }
      continue;
    }

    // ── Normal character ──────────────────────────────────────────────────────
    result += ch;
    i++;
  }

  return result;
}

/**
 * Remove blank lines that are left behind after comment removal,
 * collapsing more than 1 consecutive blank line into a single blank line.
 */
function collapseBlankLines(source) {
  return source.replace(/\n{3,}/g, '\n\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

const files = walkDir(SRC_DIR);
let processed = 0;

for (const filePath of files) {
  const original = fs.readFileSync(filePath, 'utf-8');
  const stripped = collapseBlankLines(stripComments(original));

  if (stripped !== original) {
    fs.writeFileSync(filePath, stripped, 'utf-8');
    const rel = path.relative(process.cwd(), filePath);
    console.log(`  ✔  Cleaned: ${rel}`);
    processed++;
  }
}

if (processed === 0) {
  console.log('  ✔  No comments found — all files are already clean.');
} else {
  console.log(`\n  Done. ${processed} file(s) updated.`);
}
