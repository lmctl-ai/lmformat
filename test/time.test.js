'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { formatRelativeTime } = require('..');
const { formatRateLimitReport, snapshotTime } = require('../examples/ratelimit');
const now = Date.parse('2026-09-25T20:00:00Z');

test('uses the largest whole unit with deterministic boundary rounding', () => {
  for (const [seconds, expected] of [
    [0, 'now'], [0.999, 'now'], [1, '1s'], [59, '59s'], [60, '1m'],
    [2400, '40m'], [3599, '59m'], [3600, '1h'], [46800, '13h'],
    [86399, '23h'], [86400, '1d'], [259200, '3d'], [31536000, '365d'],
  ]) {
    assert.equal(formatRelativeTime(now + seconds * 1000, { now }), expected);
    if (seconds >= 1) assert.equal(formatRelativeTime(now - seconds * 1000, { now }), `${expected} ago`);
  }
});

test('accepts Date, ISO timestamps with offsets, and epoch milliseconds', () => {
  const options = { now: new Date(now) };
  assert.equal(formatRelativeTime('2026-09-25T16:00:00-05:00', options), '1h');
  assert.equal(formatRelativeTime(new Date(now + 3600000), { now: new Date(now).toISOString() }), '1h');
  assert.equal(formatRelativeTime(0, { now: 60000 }), '1m ago');
});

test('unknown and invalid target timestamps are safe to display', () => {
  for (const value of [null, undefined, '', 'unknown', 'invalid', NaN, Infinity, new Date(NaN), false]) {
    assert.equal(formatRelativeTime(value, { now }), 'unknown');
  }
  assert.throws(() => formatRelativeTime(now, { now: 'invalid' }), /valid timestamp/);
});

test('defaults to the current time', (context) => {
  context.mock.method(Date, 'now', () => now);
  assert.equal(formatRelativeTime(now + 2400000), '40m');
});

test('rate limit example preserves values and aligns reformatted timestamps', () => {
  const report = formatRateLimitReport(snapshotTime);
  const [providers, limits] = report.split('\n\n').map((part) => part.split('\n'));
  assert.equal(providers.length, 5);
  assert.equal(limits.length, 11);
  assert.match(providers[1], /3s ago/);
  assert.match(providers[1], /has_credits=false balance=0; spend control reached=false/);
  const start = limits[0].indexOf('resets in');
  const expected = ['2d', '4h', '4d', '6m', '4d', 'unknown', '2h', '2h', '2h', '1d'];
  expected.forEach((value, index) => assert.equal(limits[index + 1].slice(start).split(' ')[0], value));
  assert.match(limits[7], /100%\s+0%\s+2h\s+EXHAUSTED$/);
  assert.equal(report.includes('2026-'), false);
});
