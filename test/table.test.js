'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { formatTable, printTable } = require('..');
const { headers, rows } = require('../examples/sessions');

test('sizes from all rows and left-aligns every column', () => {
  assert.equal(formatTable([['a', 'bb', 'c'], ['long', 'x', 'tail']]),
    'a     bb  c\nlong  x   tail');
});

test('headers participate in width calculation', () => {
  assert.equal(formatTable([['a', 'ok']], { headers: ['name', 'status'] }),
    'name  status\na     ok');
});

test('sample sessions start every cell at the same column as its header', () => {
  const lines = formatTable(rows, { headers }).split('\n');
  const starts = headers.map((header) => lines[0].indexOf(header));
  assert.equal(lines.length, 24);
  rows.forEach((row, index) => {
    row.forEach((cell, column) => {
      assert.equal(lines[index + 1].slice(starts[column], starts[column] + cell.length), cell);
      if (column > 0) assert.equal(lines[index + 1].slice(starts[column] - 2, starts[column]), '  ');
    });
    assert.equal(lines[index + 1].trimEnd(), lines[index + 1]);
  });
  assert.ok(lines[8].endsWith(rows[7][7]), 'long error text is not truncated');
});

test('handles ragged rows, missing cells, zero, and false', () => {
  assert.equal(formatTable([['a', null, 'end'], ['long'], [0, false, undefined]]),
    'a            end\nlong\n0     false');
  assert.equal(formatTable([['a', , 'z']]), 'a    z');
});

test('empty input, empty rows, header-only output, and single columns', () => {
  assert.equal(formatTable([]), '');
  assert.equal(formatTable([[]]), '');
  assert.equal(formatTable([], { headers: ['a', 'b'] }), 'a  b');
  assert.equal(formatTable([['a'], ['long']]), 'a\nlong');
});

test('does not mutate caller data', () => {
  const input = Object.freeze([Object.freeze(['a', 1])]);
  const titles = Object.freeze(['name', 'count']);
  assert.equal(formatTable(input, { headers: titles }), 'name  count\na     1');
});

test('prints through a writable stream with exactly one final newline', () => {
  const writes = [];
  const stream = { write: (text) => writes.push(text) };
  printTable([['a', 'b'], ['long', 'c']], { stream });
  printTable([], { stream });
  assert.deepEqual(writes, ['a     b\nlong  c\n']);
});

test('rejects invalid row shapes and terminal control characters', () => {
  assert.throws(() => formatTable('a'), TypeError);
  assert.throws(() => formatTable(['a']), TypeError);
  assert.throws(() => formatTable([], { headers: 'name' }), TypeError);
  for (const cell of ['a\nb', 'a\tb', '\r', '\x1b[31mred']) {
    assert.throws(() => formatTable([[cell]]), /single-line/);
  }
});
