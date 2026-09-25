'use strict';

const { formatTable, formatRelativeTime } = require('..');

// One reference time for the entire captured report, making the example reproducible.
const snapshotTime = '2026-09-25T20:33:47Z';
const providers = [
  ['codex', 'ok', 'codex_http', 'pro', '2026-09-25T20:33:44.000Z', 'has_credits=false balance=0; spend control reached=false'],
  ['agy', 'ok', 'agy_cli_print', '?', '2026-09-25T20:33:45.000Z', ''],
  ['claude', 'ok', 'claude_oauth_api', 'max', '2026-09-25T20:33:46.000Z', 'spend control reached=false'],
  ['kimi', 'ok', 'kimi_http', '?', '2026-09-25T20:33:47.000Z', ''],
];
const limits = [
  ['codex', 'codex-weekly', 'weekly', 25, 75, '2026-09-28T16:14:21Z'],
  ['agy', '3p-5h', 'five_hour', 0, 100, '2026-09-26T01:33:46Z'],
  ['agy', '3p-weekly', 'weekly', 4, 96, '2026-09-30T17:22:58Z'],
  ['agy', 'gemini-5h', 'five_hour', 11, 89, '2026-09-25T20:39:50Z'],
  ['agy', 'gemini-weekly', 'weekly', 20, 80, '2026-09-30T17:23:14Z'],
  ['claude', 'session', 'five_hour', 0, 100, 'unknown'],
  ['claude', 'week-all-models', 'weekly', 100, 0, '2026-09-25T23:00:00Z'],
  ['claude', 'week-scoped-Fable', 'weekly', 11, 89, '2026-09-25T23:00:00Z'],
  ['kimi', 'kimi-5h', 'five_hour', 23, 77, '2026-09-25T23:21:05Z'],
  ['kimi', 'kimi-weekly', 'weekly', 96, 4, '2026-09-27T02:21:05Z'],
];

function formatRateLimitReport(now = Date.now()) {
  const providerTable = formatTable(providers.map(([provider, status, source, plan, read, notes]) => [
    provider, status, source, plan, formatRelativeTime(read, { now }), notes,
  ]), { headers: ['provider', 'status', 'source', 'plan', 'read', 'notes'] });
  const limitTable = formatTable(limits.map(([provider, limit, window, used, remaining, resets]) => [
    provider, limit, window, `${used}%`, `${remaining}%`,
    formatRelativeTime(resets, { now }), remaining === 0 ? 'EXHAUSTED' : '',
  ]), { headers: ['provider', 'limit', 'window', 'used', 'remaining', 'resets in', 'status'] });
  return `${providerTable}\n\n${limitTable}`;
}

if (require.main === module) console.log(formatRateLimitReport(snapshotTime));
module.exports = { formatRateLimitReport, snapshotTime };
