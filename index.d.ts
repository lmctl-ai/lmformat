export type TableCell = string | number | boolean | null | undefined;
export type ColumnAlign = 'left' | 'right';

export interface TableOptions {
  /** Exact widths override measurement and max. Null/undefined/missing entries
   * measure automatically. Zero preserves unpadded, untruncated rendering. */
  widths?: Array<number | null | undefined>;
  headers?: TableCell[];
  align?: ColumnAlign[];
  /** Truncate over-width non-trailing cells with an ellipsis (default true). */
  truncate?: boolean;
  /** Leading indent for every line: a number of spaces or a string. */
  margin?: number | string;
  /** Per-column width caps from manual inspection; null/undefined entries
   * stay uncapped. Over-width non-trailing cells truncate with an ellipsis. */
  max?: Array<number | null | undefined>;
}

export interface Grid {
  rows: TableCell[][];
  headers?: TableCell[];
}

export interface RenderGridOptions extends TableOptions {}

export interface MeasureOptions {
  /** Exact widths override measurement and max; other entries measure. */
  widths?: Array<number | null | undefined>;
  /** Per-column width caps from manual inspection; null/undefined entries
   * stay uncapped. */
  max?: Array<number | null | undefined>;
}

export interface PrintTableOptions extends TableOptions {
  stream?: { write(text: string): void };
}

export function measureColumns(grids: Array<Grid | TableCell[][]>, options?: MeasureOptions): number[];
export function renderGrid(rows: TableCell[][], options?: RenderGridOptions): string;
export function formatTable(rows: TableCell[][], options?: TableOptions): string;
export function printTable(rows: TableCell[][], options?: PrintTableOptions): void;

export type TimestampInput = Date | number | string;

export function formatRelativeTime(value: TimestampInput, options?: { now?: TimestampInput }): string;
export function formatCount(value: number | null | undefined): string;
export type DurationUnit = 'w' | 'd' | 'h' | 'm' | 's';

export function formatDuration(milliseconds: number | null | undefined, options?: { maxUnit?: DurationUnit; style?: 'spaced' | 'compact' }): string;
export function formatClock(value?: TimestampInput): string;
export function formatLocalTimestamp(value?: TimestampInput): string;
export function formatPercent(fraction: number | null | undefined): string;
export interface BarOptions {
  width?: number;
  /** Single character of display width 1 (default '#'). */
  fill?: string;
  /** Single character of display width 1 (default ' '). */
  empty?: string;
  /** Single character of display width 1 for non-finite input (default '?'). */
  unknown?: string;
}
export function formatBar(fraction: number | null | undefined, options?: BarOptions): string;
export function formatTimer(milliseconds: number | null | undefined): string;
export function escapeCell(value: unknown): string;
