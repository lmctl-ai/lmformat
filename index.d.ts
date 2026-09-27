export type TableCell = string | number | boolean | null | undefined;
export type ColumnAlign = 'left' | 'right';

export interface TableOptions {
  headers?: TableCell[];
  align?: ColumnAlign[];
  /** Truncate over-width non-trailing cells with an ellipsis (default true). */
  truncate?: boolean;
}

export interface Grid {
  rows: TableCell[][];
  headers?: TableCell[];
}

export interface RenderGridOptions extends TableOptions {
  widths?: number[];
}

export interface MeasureOptions {
  /** Exclude +3σ width outliers per column from the measurement (default true). */
  trimOutliers?: boolean;
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
export function formatDuration(milliseconds: number | null | undefined): string;
export function formatClock(value?: TimestampInput): string;
export function formatLocalTimestamp(value?: TimestampInput): string;
export function formatPercent(fraction: number | null | undefined): string;
export function escapeCell(value: unknown): string;
