'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  formatBar,
  formatTimer,
  formatCount,
  formatDuration,
  formatClock,
  formatLocalTimestamp,
  formatPercent,
  formatTable,
  escapeCell,
} = require('..');

test('formatCount compacts thousands and millions', () => {
  assert.equal(formatCount(0), '0');
  assert.equal(formatCount(999), '999');
  assert.equal(formatCount(12_345), '12K');
  assert.equal(formatCount(960_462), '960K');
  assert.equal(formatCount(1_500_000), '1.5M');
  assert.equal(formatCount(15_791_104), '15.8M');
});

test('formatCount rounds symmetrically and promotes units after rounding', () => {
  assert.equal(formatCount(-2_500), '-3K');
  assert.equal(formatCount(999_499), '999K');
  assert.equal(formatCount(999_500), '1.0M');
  assert.equal(formatCount(999_999), '1.0M');
  assert.equal(formatCount(1_000_000), '1.0M');
});

test('formatCount reports unknown for missing or non-finite input', () => {
  for (const value of [null, undefined, NaN, Infinity, '12']) {
    assert.equal(formatCount(value), 'unknown');
  }
});

test('formatDuration renders up to two units', () => {
  assert.equal(formatDuration(0), '0s');
  assert.equal(formatDuration(999), '0s');
  assert.equal(formatDuration(45_000), '45s');
  assert.equal(formatDuration(192_000), '3m 12s');
  assert.equal(formatDuration(7_500_000), '2h 5m');
  assert.equal(formatDuration(3_600_000), '1h');
  assert.equal(formatDuration(356_400_000), '4d 3h');
  assert.equal(formatDuration(777_600_000), '1w 2d');
  assert.equal(formatDuration(604_800_000), '1w');
});

test('formatDuration keeps exact unit boundaries single-unit', () => {
  assert.equal(formatDuration(60_000), '1m');
  assert.equal(formatDuration(3_600_000), '1h');
  assert.equal(formatDuration(86_400_000), '1d');
  assert.equal(formatDuration(604_800_000), '1w');
});

test('formatDuration honors maxUnit', () => {
  assert.equal(formatDuration(777_600_000, { maxUnit: 'd' }), '9d');
  assert.equal(formatDuration(788_400_000, { maxUnit: 'd' }), '9d 3h');
  assert.equal(formatDuration(356_400_000, { maxUnit: 'h' }), '99h');
  assert.equal(formatDuration(192_000, { maxUnit: 'm' }), '3m 12s');
  assert.throws(() => formatDuration(1000, { maxUnit: 'y' }), TypeError);
});

test('formatDuration clamps negatives and reports unknown for non-finite input', () => {
  assert.equal(formatDuration(-5_000), '0s');
  for (const value of [null, undefined, NaN, Infinity]) {
    assert.equal(formatDuration(value), 'unknown');
  }
});

test('formatClock renders local HH:MM:SS', () => {
  const date = new Date(2026, 8, 27, 9, 5, 3);
  assert.equal(formatClock(date), '09:05:03');
  assert.equal(formatClock(date.getTime()), '09:05:03');
  assert.equal(formatClock('not a date'), 'unknown');
});

test('formatLocalTimestamp renders local YYYY-MM-DD HH:MM:SS', () => {
  const date = new Date(2026, 0, 2, 9, 5, 3);
  assert.equal(formatLocalTimestamp(date), '2026-01-02 09:05:03');
  assert.equal(formatLocalTimestamp('not a date'), 'unknown');
});

test('formatBar renders a bare ASCII progress fill', () => {
  assert.equal(formatBar(0), '          ');
  assert.equal(formatBar(0.12), '#         ');
  assert.equal(formatBar(0.5), '#####     ');
  assert.equal(formatBar(1), '##########');
  assert.equal(formatBar(0.16, { width: 5 }), '#    ');
  // Out-of-range clamps; non-finite fills with '?'.
  assert.equal(formatBar(1.4), '##########');
  assert.equal(formatBar(-0.2), '          ');
  for (const value of [null, undefined, NaN, Infinity]) {
    assert.equal(formatBar(value), '??????????');
  }
  assert.throws(() => formatBar(0.5, { width: 0 }), TypeError);
});

test('formatTimer renders clock-style remaining time', () => {
  assert.equal(formatTimer(0), '00:00:00');
  assert.equal(formatTimer(45_000), '00:00:45');
  assert.equal(formatTimer(2_172_000), '00:36:12');
  assert.equal(formatTimer(192_000), '00:03:12');
  assert.equal(formatTimer(7_500_000), '02:05:00');
  assert.equal(formatTimer(493_200_000), '5d 17:00:00');
  assert.equal(formatTimer(-5_000), '00:00:00');
  for (const value of [null, undefined, NaN, Infinity]) {
    assert.equal(formatTimer(value), 'unknown');
  }
});

test('escapeCell makes untrusted text safe for table cells', () => {
  assert.equal(escapeCell('plain'), 'plain');
  assert.equal(escapeCell('a\nb\tc\rd'), 'a\\nb\\tc\\rd');
  assert.equal(escapeCell('a\x1b[31m'), 'a\\x1b[31m');
  assert.equal(escapeCell(null), '');
  assert.equal(escapeCell(42), '42');
  assert.doesNotThrow(() => formatTable([[escapeCell('x\ny')]]));
});

test('formatPercent rounds fractions and tolerates bad input', () => {
  assert.equal(formatPercent(0.16), '16%');
  assert.equal(formatPercent(0.995), '100%');
  assert.equal(formatPercent(0), '0%');
  for (const value of [null, undefined, NaN, Infinity]) {
    assert.equal(formatPercent(value), '?%');
  }
});
