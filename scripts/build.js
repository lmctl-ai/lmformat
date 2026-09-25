'use strict';

const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { execFileSync } = require('node:child_process');

// The library is plain JavaScript; its build artifact is the publishable tarball.
mkdirSync('release', { recursive: true });
const [pack] = JSON.parse(execFileSync(process.execPath, [
  process.env.npm_execpath, 'pack', '--json', '--pack-destination', 'release',
], { encoding: 'utf8' }));
assert.deepEqual(pack.files.map((file) => file.path).sort(), [
  'LICENSE', 'README.md', 'index.js', 'package.json',
]);
console.log(`Built release/${pack.filename}`);
