'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  formatCount,
  formatDuration,
  formatClock,
  formatLocalTimestamp,
  formatPercent,
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

test('formatPercent rounds fractions and tolerates bad input', () => {
  assert.equal(formatPercent(0.16), '16%');
  assert.equal(formatPercent(0.995), '100%');
  assert.equal(formatPercent(0), '0%');
  for (const value of [null, undefined, NaN, Infinity]) {
    assert.equal(formatPercent(value), '?%');
  }
});
