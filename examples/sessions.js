'use strict';

const { printTable } = require('..');

const headers = ['team', 'alias', 'action', 'status', 'time spent', 'idle time', 'model', 'error'];
const rows = [
  ['triage.lmctl', 'Triage', 'chat', 'done', '25s', '3m', 'Gemini 3.8 Flash (High)'],
  ['math.lmctl', 'Lead', 'chat', 'done', '2s', '8m', 'claude-opus-5'],
  ['neocite.lmctl', 'Lead', 'chat', 'done', '33s', '1h', 'Gemini 3.1 Pro (High)'],
  ['dsh_creator.lmctl', 'Worker', 'chat', 'done', '28s', '1h', 'kimi-code/kimi-for-coding'],
  ['lmbi.lmctl', 'Lead', 'chat', 'done', '22s', '1h', 'deepseek/deepseek-v4-pro'],
  ['lmcron.lmctl', 'Lead', 'chat', 'done', '10s', '1h', 'gpt-5.6-terra'],
  ['bundle-smoke.lmctl', 'Lead', 'exec', 'done', '9s', '1h', 'default'],
  ['lmplayerAgy.lmctl', 'Lead', 'chat', 'error', '20s', '1h', 'Gemini 3.8 Flash (High)', '— agy failed (exit code 3): error: API error (attempt 1): INTERNAL (code 500): Internal error encountered.'],
  ['dsa.lmctl', 'Lead', 'chat', 'done', '22s', '1h', 'gpt-5.6-terra'],
  ['law.lmctl', 'Lead', 'chat', 'done', '14s', '1h', 'gpt-5.6-terra'],
  ['creator.lmctl', 'Lead', 'chat', 'done', '22s', '4h', 'deepseek/deepseek-v4-pro'],
  ['kimi.lmctl', 'Researcher', 'chat', 'done', '6m', '5h', 'kimi-code/k3'],
  ['refact-astra.lmctl', 'Lead', 'chat', 'done', '2m', '6h', 'gpt-6-astra'],
  ['lmctl-astra.lmctl', 'Lead', 'chat', 'done', '1m', '6h', 'gpt-6-astra'],
  ['lmctl.lmctl', 'Reviewer1', 'chat', 'done', '1m', '6h', 'gpt-6-astra'],
  ['qa-cx.lmctl', 'Lead', 'chat', 'done', '2m', '12h', 'gpt-5.6-terra'],
  ['qa-cx.lmctl', 'QA2', 'chat', 'done', '45s', '12h', 'Gemini 3.8 Flash (High)'],
  ['lmauto.lmctl', 'Coder', 'chat', 'done', '3m', '15h', 'gpt-6-astra'],
  ['lmauto.lmctl', 'Lead', 'chat', 'done', '2s', '15h', 'claude-sonnet-5'],
  ['lmprice.lmctl', 'Lead', 'chat', 'done', '26m', '17h', 'default'],
  ['lmprice.lmctl', 'Coder', 'chat', 'done', '5m', '17h', 'gpt-5.6-luna'],
  ['lmprice.lmctl', 'EconomyCoder', 'chat', 'done', '2m', '17h', 'Gemini 3.8 Flash (Medium)'],
  ['lmprice.lmctl', 'Reviewer', 'chat', 'done', '2s', '17h', 'claude-opus-5'],
];

if (require.main === module) printTable(rows, { headers });
module.exports = { headers, rows };
