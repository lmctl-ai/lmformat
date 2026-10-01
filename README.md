# lmformat

Dependency-free Node.js library for CLI output formatting: automatically sized
tables, compact counts, durations, and timestamps.
Install with `npm install @lmctl-ai/lmformat`.

Pass an array of rows; each row is an array of cells. No column widths are needed.

```js
const { formatTable, printTable } = require('@lmctl-ai/lmformat');
// ESM also supports: import { formatTable, printTable } from '@lmctl-ai/lmformat';

const rows = [
  ['triage.lmctl', 'Triage', 'done', 5, '25s'],
  ['math.lmctl', 'Lead', 'done', 120, '2s'],
];
printTable(rows, {
  headers: ['team', 'alias', 'status', 'msgs', 'time spent'],
  align: ['left', 'left', 'left', 'right', 'right'],
});
```

```text
team          alias   status  msgs  time spent
triage.lmctl  Triage  done       5         25s
math.lmctl    Lead    done     120          2s
```

`formatTable(rows, { headers, align }?)` returns a string without a final newline.
`printTable(rows, { headers, align, stream }?)` writes it with a final newline to
`process.stdout` or a supplied writable stream. Empty output writes nothing.
Headers are optional. You can also include a header as the first row.
`align` optionally sets each column to `'left'` (default) or `'right'`;
numeric columns read best right-aligned. Headers follow their column's alignment.

## Measuring and rendering separately

`formatTable` measures and renders in one step. To align SEVERAL tables on one
shared grid — for example per-section tables under standalone headings — split
the two steps:

```js
const { measureColumns, renderGrid } = require('@lmctl-ai/lmformat');

const running = [['math.lmctl:Lead', 'exec', 'running 16h ago']];
const idle = [
  ['triage.lmctl:Triage', 'chat', 'ran 24s, idle 5m ago'],
  ['or.lmctl:Lead', 'chat', 'ran 5s, idle 6m ago'],
];

const widths = measureColumns([running, idle]); // one width set across all grids
console.log(renderGrid(running, { widths, margin: 2 }));
console.log(renderGrid(idle, { widths, margin: 2 }));
```

```text
  math.lmctl:Lead      exec  running 16h ago
  triage.lmctl:Triage  chat  ran 24s, idle 5m ago
  or.lmctl:Lead        chat  ran 5s, idle 6m ago
```

`measureColumns(grids, { max }?)` takes an array of grids; a grid is a rows array or
`{ rows, headers }`. It returns the display width of each column across all
grids — simply the widest cell, headers included; pass `max` (an array of
per-column caps, `null`/`undefined` entries uncapped) to bound chosen columns.
`renderGrid(rows, { widths, headers, align, margin }?)` renders one grid
with explicit widths; a non-trailing cell wider than its width is truncated
with an ellipsis (pass `truncate: false` to let it overflow). Trailing cells
are open-ended by default; `truncateTrailing: true` bounds them as well.
`margin` (a number of spaces or a string) indents every rendered line, so
section grids can sit under their headings without caller-side prefixing.
Omitting `widths` makes `renderGrid` measure its own rows — exactly what
`formatTable` does; `max` caps that self-measurement (passing both `widths`
and `max` throws). Measure globally and render per section, or measure per
section — the caller chooses.

All rows are loaded before formatting. Each column takes the maximum cell length
across headers and data, capped per column by `max` when given; cells are
right-padded with spaces and columns have a
two-space gap. Trailing empty cells add no padding. Ragged rows are accepted;
`null`, `undefined`, and missing cells become empty strings. Other values use
`String(value)`. Inputs are not modified. Long text is never wrapped; cells
over their column's width (measured or capped) are truncated with an ellipsis,
except trailing cells unless `truncateTrailing: true`. `truncate: false`
disables all truncation.

## Column widths and caps (manual, per call)

One giant cell should not stretch a whole column — and no statistics should
decide what "giant" means. The widest cell is the default, which callers can override.
When you have inspected real output and know a column should never exceed a
width, say so: `measureColumns(grids, { max: [26, null, 20] })` caps column 0
at 26 and column 2 at 20, leaving column 1 uncapped. Caps also work through
`renderGrid`/`formatTable`/`printTable` when they self-measure. A cap smaller
than the header caps the header too (you own both); a cap on the trailing
column takes effect only with `truncateTrailing: true`. When
rendering, a non-trailing cell wider than its column is truncated to the
width with a trailing `…`; pass `truncate: false` to let such cells overflow
instead.

To override just one column, measure first and edit that entry. This can either
narrow or widen the column while leaving the other measurements intact:

```js
const widths = measureColumns([running, idle]);
widths[1] = 20;
console.log(renderGrid(running, { widths }));
console.log(renderGrid(idle, { widths }));
```

To bound a long trailing reason, opt into truncating the last populated cell
of each row. This also applies to headers, ragged rows, and single-column tables:

```js
const rows = [['math', 'a very long reason']];
const widths = measureColumns([rows]);
widths[1] = 10;
renderGrid(rows, { widths, truncateTrailing: true }); // 'math  a very lo…'
// The same result using automatic measurement with a cap:
formatTable(rows, { max: [null, 10], truncateTrailing: true });
```

`truncateTrailing` defaults to `false` and works in `renderGrid`, `formatTable`,
and `printTable`. It uses the existing column width and `ellipsis` option.
`truncate: false` takes precedence. Zero or missing explicit widths remain
unconstrained. Left-aligned trailing cells stay unpadded; right alignment still
pads on the left. This is single-line truncation, not wrapping within cells.

The truncation mark itself is an option: `ellipsis` defaults to `…`; pass
`'...'` for ASCII-only terminals or `''` for a hard cut. A mark wider than the
column falls back to `…`. Like the bar glyphs (`fill`/`empty`/`unknown`), every
baked-in glyph is a caller option whose default keeps existing output unchanged.

Cells must be plain single-line text: tabs, newlines, ANSI escape sequences, and
other terminal control characters are rejected (use `escapeCell` to sanitize
untrusted text first). Widths are terminal display widths: East Asian
wide/fullwidth characters and most emoji count double, combining marks and
zero-width characters count zero (a pragmatic zero-dependency approximation,
not a full UAX #11 implementation). A terminal
narrower than the output may wrap lines.

Requires Node.js 18 or newer. Run `npm test` for alignment tests, `npm run check`
for syntax checks, and `npm run example` for the complete session example.

## Relative timestamps

```js
const { formatRelativeTime, printTable } = require('@lmctl-ai/lmformat');
const now = '2026-09-25T20:00:00Z'; // Omit to use Date.now().
printTable([
  ['weekly', formatRelativeTime('2026-09-28T20:00:00Z', { now })],
  ['session', formatRelativeTime('2026-09-25T20:40:00Z', { now })],
  ['missing', formatRelativeTime('unknown', { now })],
], { headers: ['limit', 'resets in'] });
// limit    resets in
// weekly   3d
// session  40m
// missing  unknown
```

`formatRelativeTime(timestamp, { now }?)` accepts a Date, an epoch timestamp in
milliseconds, or a date string accepted by `Date.parse`. Prefer ISO 8601 strings
with an explicit timezone. It returns the largest whole unit (`w`, `d`, `h`,
`m`, `s`), rounding down: 2 days and 20 hours becomes `2d`. Days mean 24 hours;
weeks mean 7 days.
Future timestamps return `3d`; past timestamps return `3d ago`; differences below
one second return `now`. Missing or invalid timestamps return `unknown`.
An invalid explicit `now` throws a TypeError. Capture `now` once when formatting
multiple timestamps so the report uses a consistent reference time.

Run `npm run example:ratelimit` for the supplied provider and rate-limit data,
including read ages, reset countdowns, credits, and exhausted status. This example
uses the fixed snapshot time `2026-09-25T20:33:47Z` for reproducible output.
Transform timestamp cells before passing rows to the table formatter; widths
are calculated from the resulting text automatically.

## Counts, durations, and clocks

```js
const {
  formatCount, formatDuration, formatPercent, formatClock, formatLocalTimestamp,
  formatBar, formatTimer,
} = require('@lmctl-ai/lmformat');

formatCount(960_462);        // "960K"   (>= 1M keeps one decimal: "15.8M")
formatDuration(7_500_000);   // "2h 5m"  (up to two units: "3m 12s", "1w 2d")
formatDuration(788_400_000, { maxUnit: "d" });  // "9d 3h" (cap the largest unit)
formatDuration(180_180_000, { style: "compact" }); // "2d02h03m" (dense, no seconds)
formatPercent(0.16);         // "16%"
formatBar(0.16);             // "##        "  (bare fill, no frame)
formatBar(0.5, { width: 6, fill: '█', empty: '░' }); // "███░░░"
formatBar(null, { width: 3, unknown: '·' });        // "···"
formatTimer(2_172_000);       // "00:36:12"  ("5d 18:24:33" past 24h)
formatClock();               // "09:05:03"          local wall clock, now or given time
formatLocalTimestamp();      // "2026-01-02 09:05:03"  local date and time
```

`formatCount` accepts a finite number and returns `unknown` otherwise. It rounds
symmetrically for negative values and promotes units after rounding, so
`999_999` becomes `"1.0M"` rather than `"1000K"`.
`formatDuration` takes milliseconds, clamps negatives to `0s`, and returns
`unknown` for non-finite input. `formatPercent` takes a fraction (`0.16` for 16%)
and returns `?%` for non-finite input — deliberately not `unknown`, since the
inline `used ?% remaining ?%` context wants the unit suffix kept. `formatClock` and `formatLocalTimestamp`
accept a Date, epoch milliseconds, or a parseable date string (default: now),
and return `unknown` for invalid input.

`formatBar` defaults to width 10, fill `#`, empty space, and unknown `?`.
Each custom glyph must be a single character with terminal display width 1;
wide emoji/CJK, combining marks, control characters, and multi-character strings
are rejected. Fractions still round to the nearest filled cell and clamp to
0–1. Non-finite input repeats the `unknown` glyph across the bar.

MIT licensed. Project homepage: [lmctl.com](https://lmctl.com).

## Publishing

CI builds and tests pushes to `main` and pull requests on Node 18, 20, 22, and 24.
It also installs the built tarball and checks CommonJS and ESM imports.
`npm run build` checks syntax and produces `release/lmctl-ai-lmformat-VERSION.tgz`.
Only the library, TypeScript declarations, package metadata, README, and license are included.

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
from GitHub Actions with provenance. No npm token is stored in GitHub.

The first public version, `0.13.0`, was published on October 1, 2026. The trusted
publisher is configured for repository `lmctl-ai/lmformat`, workflow `publish.yml`,
with no environment restriction and direct publishing allowed. Maintainers do not
need to repeat the initial publication or log into npm for ordinary tagged releases.

If the trust configuration needs to be recreated, an authenticated npm package
maintainer can run this command and complete npm's browser verification:

```sh
npm trust github @lmctl-ai/lmformat --file publish.yml --repo lmctl-ai/lmformat --allow-publish --yes
```

New versions publish automatically when their matching version tag is pushed.
The workflow tests and builds again before publishing with provenance.

For example, after committing changes on `main`:

```sh
npm version patch -m 'Release %s for npm consumers'
git push origin main
git push origin --tags
```

The tag must equal `v` plus the version in `package.json`. A tag for an already
published version cannot republish it. No version is changed by CI itself.
For a build and publish dry run, use the Publish workflow's **Run workflow** button
with `dry_run` checked. To retry an unpublished tagged version, select that tag
and uncheck `dry_run`. Real manual publishes from branch refs are rejected.
