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

/** Format rows using the widest cell in each column, with two spaces between columns. */
function formatTable(rows, { headers } = {}) {
  if (!Array.isArray(rows)) {
    throw new TypeError('rows must be an array of row arrays');
  }
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
    return row.slice(0, last + 1).map((cell, column) => (
      column === last ? cell : cell.padEnd(widths[column])
    )).join('  ');
  }).join('\n');
}

/** Print a formatted table and a final newline; empty output writes nothing. */
function printTable(rows, { headers, stream = process.stdout } = {}) {
  const output = formatTable(rows, { headers });
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
