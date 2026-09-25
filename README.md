# lmformat

Dependency-free Node.js library for automatically sized, left-aligned CLI tables.
Pass an array of rows; each row is an array of cells. No column widths are needed.

```js
const { formatTable, printTable } = require('lmformat');
// ESM also supports: import { formatTable, printTable } from 'lmformat';

const rows = [
  ['triage.lmctl', 'Triage', 'done', '25s'],
  ['math.lmctl', 'Lead', 'done', '2s'],
];
printTable(rows, { headers: ['team', 'alias', 'status', 'time spent'] });
```

```text
team          alias   status  time spent
triage.lmctl  Triage  done    25s
math.lmctl    Lead    done    2s
```

`formatTable(rows, { headers }?)` returns a string without a final newline.
`printTable(rows, { headers, stream }?)` writes it with a final newline to
`process.stdout` or a supplied writable stream. Empty output writes nothing.
Headers are optional. You can also include a header as the first row.

All rows are loaded before formatting. Each column takes the maximum cell length
across headers and data; cells are right-padded with spaces and columns have a
two-space gap. Trailing empty cells add no padding. Ragged rows are accepted;
`null`, `undefined`, and missing cells become empty strings. Other values use
`String(value)`. Inputs are not modified and long text is never truncated or wrapped.

Cells must be plain single-line text: tabs, newlines, ANSI escape sequences, and
other terminal control characters are rejected. Widths use JavaScript string
length, suitable for ASCII and the supplied session data. Wide Unicode characters,
emoji, and combining marks may not align by terminal display width. A terminal
narrower than the output may wrap lines.

Requires Node.js 18 or newer. Run `npm test` for alignment tests, `npm run check`
for syntax checks, and `npm run example` for the complete session example.
