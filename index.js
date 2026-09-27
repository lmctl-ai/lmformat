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

/** Format rows using the widest cell in each column, with two spaces between columns. */
function formatTable(rows, { headers, align } = {}) {
  if (!Array.isArray(rows)) {
    throw new TypeError('rows must be an array of row arrays');
  }
  const alignment = normalizeAlign(align);
  const table = rows.map(normalizeRow);
  if (headers !== undefined) table.unshift(normalizeRow(headers));

  const widths = [];
  for (const row of table) {
    row.forEach((cell, column) => {
      widths[column] = Math.max(widths[column] || 0, cell.length);
    });
  }

  return table.map((row) => {
    // Omit absent trailing cells, but preserve padding before later populated cells.
    let last = row.length - 1;
    while (last >= 0 && row[last] === '') last--;
    return row.slice(0, last + 1).map((cell, column) => {
      if (alignment[column] === 'right') return cell.padStart(widths[column]);
      return column === last ? cell : cell.padEnd(widths[column]);
    }).join('  ');
  }).join('\n');
}

/** Print a formatted table and a final newline; empty output writes nothing. */
function printTable(rows, { headers, align, stream = process.stdout } = {}) {
  const output = formatTable(rows, { headers, align });
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
  for (const [unit, size] of [['d', 86400], ['h', 3600], ['m', 60], ['s', 1]]) {
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

/** Elapsed duration with up to two units: 45s, 3m 12s, 2h 5m, 4d 3h. */
function formatDuration(milliseconds) {
  if (typeof milliseconds !== 'number' || !Number.isFinite(milliseconds)) return 'unknown';
  let seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const parts = [];
  for (const [unit, size] of [['d', 86400], ['h', 3600], ['m', 60], ['s', 1]]) {
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
