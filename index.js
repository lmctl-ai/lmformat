'use strict';

function normalizeRow(row) {
  if (!Array.isArray(row)) {
    throw new TypeError('Each row and headers must be an array of cells');
  }
  return Array.from(row, (value) => {
    const cell = value == null ? '' : String(value);
    if (/[\x00-\x1f\x7f-\x9f]/u.test(cell)) {
      throw new TypeError('Cells must be single-line text without terminal control characters');
    }
    return cell;
  });
}

function normalizeAlign(align) {
  if (align === undefined) return [];
  if (!Array.isArray(align)) {
    throw new TypeError('align must be an array of "left" or "right" per column');
  }
  return align.map((value) => {
    if (value !== 'left' && value !== 'right') {
      throw new TypeError('align entries must be "left" or "right"');
    }
    return value;
  });
}

/** Approximate terminal display width (zero-dependency wcwidth): combining
 * marks and zero-width characters add nothing; East Asian wide/fullwidth
 * code points and most emoji count double. Close enough for column
 * alignment; not a full UAX #11 implementation. */
function displayWidth(text) {
  let width = 0;
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (
      (cp >= 0x0300 && cp <= 0x036f) ||   // combining diacritical marks
      (cp >= 0x1ab0 && cp <= 0x1aff) ||   // combining diacriticals extended
      (cp >= 0x1dc0 && cp <= 0x1dff) ||   // combining diacriticals supplement
      (cp >= 0x20d0 && cp <= 0x20ff) ||   // combining marks for symbols
      (cp >= 0xfe00 && cp <= 0xfe0f) ||   // variation selectors
      (cp >= 0xfe20 && cp <= 0xfe2f) ||   // combining half marks
      cp === 0x200b ||                    // zero-width space
      (cp >= 0xe0100 && cp <= 0xe01ef)    // variation selectors supplement
    ) continue;
    if (
      (cp >= 0x1100 && cp <= 0x115f) ||   // Hangul Jamo
      (cp >= 0x2e80 && cp <= 0x303e) ||   // CJK radicals, Kangxi, ideographic
      (cp >= 0x3041 && cp <= 0x33ff) ||   // Hiragana, Katakana, CJK compatibility
      (cp >= 0x3400 && cp <= 0x4dbf) ||   // CJK extension A
      (cp >= 0x4e00 && cp <= 0x9fff) ||   // CJK unified ideographs
      (cp >= 0xa000 && cp <= 0xa4cf) ||   // Yi
      (cp >= 0xac00 && cp <= 0xd7a3) ||   // Hangul syllables
      (cp >= 0xf900 && cp <= 0xfaff) ||   // CJK compatibility ideographs
      (cp >= 0xfe30 && cp <= 0xfe6f) ||   // CJK compatibility forms
      (cp >= 0xff00 && cp <= 0xff60) ||   // fullwidth forms
      (cp >= 0xffe0 && cp <= 0xffe6) ||   // fullwidth signs
      (cp >= 0x2600 && cp <= 0x27bf) ||   // misc symbols + dingbats
      (cp >= 0x1f000 && cp <= 0x1faff) || // emoji (incl. transport, supplemental)
      (cp >= 0x20000 && cp <= 0x3fffd)    // CJK extensions B+
    ) {
      width += 2;
      continue;
    }
    width += 1;
  }
  return width;
}

function padDisplay(cell, width, right) {
  const padding = ' '.repeat(Math.max(0, width - displayWidth(cell)));
  return right ? padding + cell : cell + padding;
}

function normalizeGrid(grid) {
  if (Array.isArray(grid)) return { rows: grid };
  if (grid !== null && typeof grid === 'object' && Array.isArray(grid.rows)) return grid;
  throw new TypeError('each grid must be a rows array or { rows, headers }');
}

/** Truncate a cell to a display width, ending with an ellipsis. */
function truncateDisplay(cell, width) {
  if (displayWidth(cell) <= width) return cell;
  if (width <= 1) return '…';
  let out = '';
  let used = 0;
  for (const char of cell) {
    const charWidth = displayWidth(char);
    if (used + charWidth > width - 1) break;
    out += char;
    used += charWidth;
  }
  return `${out}…`;
}

function normalizeMax(max) {
  if (max === undefined) return [];
  if (!Array.isArray(max)) {
    throw new TypeError('max must be an array of per-column width caps');
  }
  return max.map((value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
      throw new TypeError('max entries must be positive integers, null, or undefined');
    }
    return value;
  });
}

/** Measure column display widths across one or more grids. Pair with
 * renderGrid to align several tables on one shared grid.
 * Each column's width is simply the widest cell (headers included) — no
 * statistical trimming. When real data shows a column needs a bound, pass
 * { max: [cap, ...] } with a manually chosen cap per column (null/undefined
 * entries stay uncapped); over-width non-trailing cells then truncate with
 * an ellipsis at render time. A cap on the trailing column has no visible
 * effect: trailing cells are open-ended by design. */
function measureColumns(grids, { max } = {}) {
  if (!Array.isArray(grids)) {
    throw new TypeError('grids must be an array of grids');
  }
  const caps = normalizeMax(max);
  const widths = [];
  const push = (column, width) => {
    widths[column] = Math.max(widths[column] ?? 0, width);
  };
  for (const input of grids) {
    const grid = normalizeGrid(input);
    if (grid.headers !== undefined) {
      normalizeRow(grid.headers).forEach((cell, column) => {
        push(column, displayWidth(cell));
      });
    }
    for (const row of grid.rows.map(normalizeRow)) {
      row.forEach((cell, column) => {
        push(column, displayWidth(cell));
      });
    }
  }
  return widths.map((width, column) => {
    const cap = caps[column];
    return cap === undefined ? width : Math.min(width, cap);
  });
}

exports.measureColumns = measureColumns;

function normalizeMargin(margin) {
  if (margin === undefined) return '';
  if (typeof margin === 'number' && Number.isInteger(margin) && margin >= 0) return ' '.repeat(margin);
  if (typeof margin === 'string' && !/[\x00-\x1f\x7f-\x9f]/u.test(margin)) return margin;
  throw new TypeError('margin must be a number of spaces or a single-line string');
}

/** Render rows with explicit column widths (from measureColumns). Non-trailing
 * cells wider than their column are truncated with an ellipsis so the grid
 * stays aligned (pass { truncate: false } to let them overflow); trailing
 * cells are never padded or truncated, so an open-ended last column renders
 * in full. Omitted widths measure the given rows alone (equivalent to
 * formatTable); { max } caps that self-measurement per column (it is an
 * error to pass both widths and max). `margin` (spaces count or string)
 * indents every line. */
function renderGrid(rows, { widths, headers, align, truncate = true, margin, max } = {}) {
  if (!Array.isArray(rows)) {
    throw new TypeError('rows must be an array of row arrays');
  }
  if (widths !== undefined && !Array.isArray(widths)) {
    throw new TypeError('widths must be an array of column widths');
  }
  if (widths !== undefined && max !== undefined) {
    throw new TypeError('pass widths or max, not both (max caps a measurement)');
  }
  const indent = normalizeMargin(margin);
  const alignment = normalizeAlign(align);
  const columns = widths ?? measureColumns([{ rows, headers }], { max });
  const table = rows.map(normalizeRow);
  if (headers !== undefined) table.unshift(normalizeRow(headers));

  const body = table.map((row) => {
    // Omit absent trailing cells, but preserve padding before later populated cells.
    let last = row.length - 1;
    while (last >= 0 && row[last] === '') last--;
    return row.slice(0, last + 1).map((cell, column) => {
      const width = columns[column] || 0;
      const fitted = truncate && width > 0 && column !== last ? truncateDisplay(cell, width) : cell;
      if (alignment[column] === 'right') return padDisplay(fitted, width, true);
      return column === last ? fitted : padDisplay(fitted, width, false);
    }).join('  ');
  }).join('\n');
  if (body === '' || indent === '') return body;
  return `${indent}${body.split('\n').join(`\n${indent}`)}`;
}

exports.renderGrid = renderGrid;

/** Format rows using the widest cell in each column, with two spaces between columns. */
function formatTable(rows, { headers, align, truncate, margin, max } = {}) {
  return renderGrid(rows, { headers, align, truncate, margin, max });
}

/** Print a formatted table and a final newline; empty output writes nothing. */
function printTable(rows, { headers, align, truncate, margin, max, stream = process.stdout } = {}) {
  const output = formatTable(rows, { headers, align, truncate, margin, max });
  if (output) stream.write(`${output}\n`);
}

exports.formatTable = formatTable;
exports.printTable = printTable;

function timestamp(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) return Date.parse(value);
  return NaN;
}

/** Compact time until a timestamp; past times carry an "ago" suffix. */
function formatRelativeTime(value, { now = Date.now() } = {}) {
  const reference = timestamp(now);
  if (!Number.isFinite(reference)) throw new TypeError('now must be a valid timestamp');
  const target = timestamp(value);
  if (!Number.isFinite(target)) return 'unknown';

  const difference = target - reference;
  const seconds = Math.floor(Math.abs(difference) / 1000);
  if (seconds === 0) return 'now';
  for (const [unit, size] of [['w', 604800], ['d', 86400], ['h', 3600], ['m', 60], ['s', 1]]) {
    if (seconds >= size) {
      return `${Math.floor(seconds / size)}${unit}${difference < 0 ? ' ago' : ''}`;
    }
  }
}

exports.formatRelativeTime = formatRelativeTime;

/** Compact token/byte-style count: 960462 -> "960K", 15791104 -> "15.8M". */
function formatCount(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'unknown';
  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  if (absolute < 1_000) return String(value);
  const thousands = Math.round(absolute / 1_000);
  // Promote after rounding so 999_999 becomes "1.0M", not "1000K".
  if (thousands < 1_000) return `${sign}${thousands}K`;
  return `${sign}${(absolute / 1_000_000).toFixed(1)}M`;
}

exports.formatCount = formatCount;

const DURATION_UNITS = [['w', 604800], ['d', 86400], ['h', 3600], ['m', 60], ['s', 1]];

/** Elapsed duration. Default style is up to two spaced units: "45s",
 * "3m 12s", "2h 5m", "1w 2d". `style: 'compact'` renders zero-padded
 * adjacent units down to MINUTES with no seconds: "2d02h03m", "04h59m",
 * "<1m" — dense cells for grids. `maxUnit` ('w' default, or 'd'/'h'/'m'/'s')
 * caps the largest unit — e.g. 'd' renders 9 days as "9d 3h" / "9d03h"
 * instead of "1w 2d". */
function formatDuration(milliseconds, { maxUnit = 'w', style = 'spaced' } = {}) {
  if (typeof milliseconds !== 'number' || !Number.isFinite(milliseconds)) return 'unknown';
  const start = DURATION_UNITS.findIndex(([unit]) => unit === maxUnit);
  if (start === -1) throw new TypeError('maxUnit must be one of "w", "d", "h", "m", "s"');
  if (style !== 'spaced' && style !== 'compact') throw new TypeError('style must be "spaced" or "compact"');
  const secondsTotal = Math.floor(Math.max(0, milliseconds) / 1000);
  if (style === 'compact') {
    const units = DURATION_UNITS.slice(start).filter(([unit]) => unit !== 's');
    if (units.length === 0 || secondsTotal < 60) return '<1m';
    const parts = [];
    let rest = secondsTotal;
    let started = false;
    for (const [unit, size] of units) {
      const amount = Math.floor(rest / size);
      rest -= amount * size;
      if (amount > 0 && !started) {
        const text = unit === 'd' || unit === 'w' ? `${amount}${unit}` : `${pad2(amount)}${unit}`;
        parts.push({ text, zero: false });
        started = true;
      } else if (started) {
        parts.push({ text: `${pad2(amount)}${unit}`, zero: amount === 0 });
      }
    }
    // Positional zeros stay mid-sequence ("2d00h03m"); trailing zeros drop.
    while (parts.length > 0 && parts[parts.length - 1].zero) parts.pop();
    return parts.map((part) => part.text).join('');
  }
  let seconds = secondsTotal;
  const parts = [];
  for (const [unit, size] of DURATION_UNITS.slice(start)) {
    if (seconds >= size || (unit === 's' && parts.length === 0)) {
      const amount = Math.floor(seconds / size);
      seconds -= amount * size;
      parts.push(`${amount}${unit}`);
      if (parts.length === 2) break;
    }
  }
  return parts.join(' ');
}

exports.formatDuration = formatDuration;

function localDate(value) {
  if (value === undefined) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'number' || typeof value === 'string') return new Date(value);
  return new Date(NaN);
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

/** Local wall clock "HH:MM:SS", for step narration on stderr. */
function formatClock(value) {
  const date = localDate(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

exports.formatClock = formatClock;

/** Local timestamp "YYYY-MM-DD HH:MM:SS", for log-style lines. */
function formatLocalTimestamp(value) {
  const date = localDate(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const day = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  return `${day} ${formatClock(date)}`;
}

exports.formatLocalTimestamp = formatLocalTimestamp;

/** Percentage from a fraction: 0.16 -> "16%"; non-finite input -> "?%". */
function formatPercent(fraction) {
  return typeof fraction === 'number' && Number.isFinite(fraction)
    ? `${Math.round(fraction * 100)}%`
    : '?%';
}

exports.formatPercent = formatPercent;

/** ASCII progress bar for a fraction: 0.12 -> "#         " (bare fill, no
 * frame — the grid provides the structure). Non-finite input fills "?". */
function formatBar(fraction, { width = 10 } = {}) {
  if (typeof width !== 'number' || !Number.isInteger(width) || width < 1) {
    throw new TypeError('width must be a positive integer');
  }
  if (typeof fraction !== 'number' || !Number.isFinite(fraction)) {
    return '?'.repeat(width);
  }
  const filled = Math.min(width, Math.max(0, Math.round(fraction * width)));
  return `${'#'.repeat(filled)}${' '.repeat(width - filled)}`;
}

exports.formatBar = formatBar;

/** Clock-style remaining time: "00:36:12", days-prefixed past 24h
 * ("5d 18:24:33"). Floors to whole seconds. */
function formatTimer(milliseconds) {
  if (typeof milliseconds !== 'number' || !Number.isFinite(milliseconds)) return 'unknown';
  let seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const days = Math.floor(seconds / 86400);
  seconds -= days * 86400;
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  const clock = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

exports.formatTimer = formatTimer;

/** Escape terminal control characters so untrusted text survives formatTable. */
function escapeCell(value) {
  const text = value == null ? '' : String(value);
  return text.replace(/[\x00-\x1f\x7f-\x9f]/gu, (char) => {
    if (char === '\n') return '\\n';
    if (char === '\t') return '\\t';
    if (char === '\r') return '\\r';
    return `\\x${char.codePointAt(0).toString(16).padStart(2, '0')}`;
  });
}

exports.escapeCell = escapeCell;
