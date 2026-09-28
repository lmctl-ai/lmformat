# CLI Output Design Checklist

Design principles for human-readable CLI output in the lmctl ecosystem,
distilled from the lmformat integration sessions (2026-09-27). lmformat
implements these; callers supply structure, the library owns formatting.

## Sections

- Every section gets a **standalone heading** on its own line
  (`Running (2):`, `codex: ok (codex_http) plan=pro read 21:50:14`).
- **Blank line between sections.**
- Section headings carry context, not ISO timestamps — local `hh:mm:ss`
  (`formatClock`) is enough for a report read "around now".

## Tables and grids

- **Measure once, render per section**: `measureColumns([grid1, grid2, ...])`
  computes one width set across all sections; `renderGrid(grid, { widths,
  margin: 2 })` renders each section. Headings never become grid rows.
- **Column headers print once**, above the first section with rows; header
  labels participate in the shared measurement so alignment holds.
- **Cells are bare values** — no in-cell labels (`model=`, `used `,
  `liveness=`). The column header carries the name.
- **Numeric columns right-aligned** (`align: 'right'`).
- **The open-ended, variable-length column goes LAST** (timing text, error
  tails). Trailing cells are never padded or truncated, so ragged length
  never stretches the aligned prefix.
- Reorder columns to achieve this rather than accepting mid-grid raggedness.

## Numbers and times

- Compact counts: `960K`, `15.8M` (`formatCount`).
- Durations and countdowns: two units of precision in prose — `45s`,
  `3m 12s`, `2h 5m` (`formatDuration`). In grids, use the compact style —
  `2d02h03m`, `04h59m`, `<1m` (`style: 'compact'`, no seconds). Cap the
  largest unit to the context (`maxUnit: 'd'` for rate-limit resets; weeks
  are fine for ages).
- Ages carry direction: `3d ago` (`formatRelativeTime`).
- Percent from fractions: `16%`; non-finite input renders `?%`.
- Progress is a **bare ASCII fill** (`###       `, `formatBar`) — no bracket
  frame; the grid is the structure. Pace-matched pairs (usage vs window
  elapsed) with equal fills mean "perfectly paced"; add an OVERSTOCK column:
  under pace (overstock) is usage slack as a percent (`+48%`); over pace
  (understock) is the time the user will be blocked — quota exhausts before
  reset at the current burn rate (`-2d02h03m`).
- Absolute ISO timestamps and exact values belong in `--json`, not in
  human text.

## Robustness (never break the report)

- Alignment uses **terminal display width**: CJK/emoji count double,
  combining marks zero.
- **Width outliers are trimmed** from column measurement (wider than both
  mean+3σ and 3× median — modest variation and headers never trim), and
  over-width mid-row cells truncate with `…`. Both opt out per call
  (`trimOutliers: false`, `truncate: false`).
- Untrusted text (filesystem paths, DB values, provider payloads) goes
  through `escapeCell` — one bad value must never abort a listing.
- Missing or invalid data renders as `unknown` / `?%`, never throws.
- Best effort everywhere: lint/cost/ratelimit warn or omit rather than
  error on unrecognized models or providers.

## Channels and contracts

- **stdout is machine-clean**: only the report. Step narration
  (`verifying ...`, `launching ...`, heartbeats) goes to stderr with
  `hh:mm:ss` stamps.
- `--json` output is a contract: display changes never touch it, and any
  value dropped from text (exact timestamps, raw counts) must remain
  available there.
