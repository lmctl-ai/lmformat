'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { formatTable, measureColumns, printTable, renderGrid } = require('..');
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

test('right-aligns columns marked in align, headers included', () => {
  assert.equal(
    formatTable([['triage.lmctl', 5, '25s'], ['math.lmctl', 120, '2s']],
      { headers: ['team', 'msgs', 'time'], align: ['left', 'right', 'right'] }),
    'team          msgs  time\ntriage.lmctl     5   25s\nmath.lmctl     120    2s',
  );
});

test('right-aligns the last populated cell and single-column tables', () => {
  assert.equal(formatTable([['count'], ['1'], ['100']], { align: ['right'] }),
    'count\n    1\n  100');
  // Left-aligned trailing cells still get no padding.
  assert.equal(formatTable([['h'], ['a'], ['bb']]), 'h\na\nbb');
});

test('align defaults to left and rejects unknown entries', () => {
  assert.equal(formatTable([[1, 2]], { align: [] }), '1  2');
  assert.throws(() => formatTable([['a']], { align: 'right' }), TypeError);
  assert.throws(() => formatTable([['a']], { align: ['center'] }), TypeError);
});

test('aligns by terminal display width: CJK, emoji, combining marks', () => {
  // '名字' is 2+2 display columns (4), 'ab' is 2 — 'ab' gets 2 padding spaces.
  assert.equal(formatTable([['名字', 'x'], ['ab', 'y']]), '名字  x\nab    y');
  // Emoji count double; the ASCII row pads to the same display column.
  assert.equal(formatTable([['🚀', 1], ['ab', 2]]), '🚀  1\nab  2');
  // Combining marks add no width: 'é' (e + U+0301) measures as 1 column.
  assert.equal(formatTable([['é', 'z'], ['bc', 'q']]), 'é   z\nbc  q');
  // Width-aware padding composes with right alignment.
  assert.equal(formatTable([['名字', 1], ['ab', 22]], { align: ['left', 'right'] }),
    '名字   1\nab    22');
});

test('measureColumns + renderGrid align separate tables on one shared grid', () => {
  const running = [['math.lmctl:Lead', 'exec', 'running 16h ago']];
  const idle = [['triage.lmctl:Triage', 'chat', 'ran 24s, idle 5m ago'], ['or.lmctl:Lead', 'chat', 'ran 5s, idle 6m ago']];
  const widths = measureColumns([running, idle]);
  assert.deepEqual(widths, [19, 4, 20]);
  assert.equal(renderGrid(running, { widths }), 'math.lmctl:Lead      exec  running 16h ago');
  assert.equal(renderGrid(idle, { widths }),
    'triage.lmctl:Triage  chat  ran 24s, idle 5m ago\nor.lmctl:Lead        chat  ran 5s, idle 6m ago');
});

test('measureColumns honors grid headers and bare rows arrays', () => {
  assert.deepEqual(measureColumns([[['aa']]]), [2]);
  assert.deepEqual(measureColumns([{ rows: [['aa']], headers: ['header'] }]), [6]);
  assert.deepEqual(measureColumns([]), []);
  assert.throws(() => measureColumns('x'), TypeError);
  assert.throws(() => measureColumns([{ rows: 'x' }]), TypeError);
});

test('renderGrid without widths measures its own rows; short widths truncate', () => {
  assert.equal(renderGrid([['a', 'bb'], ['long', 'x']]), 'a     bb\nlong  x');
  // A width narrower than a non-trailing cell truncates it with an ellipsis.
  assert.equal(renderGrid([['long', 'x']], { widths: [2, 1] }), 'l…  x');
  // Opt out to let over-width cells overflow instead.
  assert.equal(renderGrid([['long', 'x']], { widths: [2, 1], truncate: false }), 'long  x');
  // A zero/missing width never truncates (caller passed no constraint).
  assert.equal(renderGrid([['long', 'x']], { widths: [] }), 'long  x');
  // Trailing cells are never truncated — an open-ended last column renders in full.
  assert.equal(renderGrid([['a', 'a very long trailing cell']], { widths: [1, 3] }),
    'a  a very long trailing cell');
  assert.throws(() => renderGrid([['a']], { widths: 'wide' }), TypeError);
});

test('measureColumns trims only egregious width outliers by default', () => {
  // One 120-char cell among ~10-char cells: excluded from the width.
  const quiet = Array.from({ length: 12 }, (_, i) => [`row-${i}`, 'ok']);
  const giant = [['row-x', 'E'.repeat(120)]];
  const widths = measureColumns([quiet, giant]);
  assert.equal(widths[1], 2); // the 120-char cell is trimmed; kept max is 'ok'
  assert.deepEqual(measureColumns([quiet, giant], { trimOutliers: false })[1], 120);
  // Modest variation is NOT trimmed: one 12-char cell among 6..8-char cells stays.
  const aliases = [['Lead'], ['Reviewer'], ['MetaLead-long']];
  assert.equal(measureColumns([aliases])[0], 13);
  // Headers are never trimmed, even when wider than every data cell.
  assert.equal(measureColumns([{ rows: [['a'], ['bb']], headers: ['a very wide header'] }])[0], 18);
});

test('margin indents every rendered line, empty output stays empty', () => {
  assert.equal(formatTable([['a', 'bb'], ['long', 'x']], { margin: 2 }), '  a     bb\n  long  x');
  assert.equal(formatTable([['a', 'bb'], ['long', 'x']], { margin: '> ' }), '> a     bb\n> long  x');
  assert.equal(renderGrid([['a']], { widths: [1], margin: 4 }), '    a');
  assert.equal(formatTable([], { margin: 2 }), '');
  assert.equal(formatTable([], { headers: ['h'], margin: 2 }), '  h');
  assert.throws(() => formatTable([['a']], { margin: -1 }), TypeError);
  assert.throws(() => formatTable([['a']], { margin: 1.5 }), TypeError);
  assert.throws(() => formatTable([['a']], { margin: 'x\ny' }), TypeError);
});

test('over-width outlier cells render truncated with an ellipsis', () => {
  // The giant cell sits MID-row (a trailing cell is open-ended by design).
  const rows = [
    ['alpha', 'ok'], ['beta', 'ok'], ['gamma', 'ok'], ['delta', 'ok'],
    ['epsilon', 'ok'], ['zeta', 'ok'], ['eta', 'ok'], ['theta', 'ok'],
    ['iota', 'ok'], ['kappa', 'ok'], ['lambda', 'ok'],
    ['mu', `${'E'.repeat(120)}`, 'tail'],
  ];
  const lines = formatTable(rows).split('\n');
  const out = lines[11];
  assert.ok(out.includes('…'));
  assert.ok(!out.includes('E'.repeat(120)));
  // The truncated cell still occupies its column: 'tail' starts where the
  // other rows' third column would, and the first columns are intact.
  assert.ok(lines[0].startsWith('alpha'));
  assert.ok(out.endsWith('tail'));
});
