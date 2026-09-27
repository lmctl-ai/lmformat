export type TableCell = string | number | boolean | null | undefined;
export type ColumnAlign = 'left' | 'right';

export interface TableOptions {
  headers?: TableCell[];
  align?: ColumnAlign[];
}

export interface PrintTableOptions extends TableOptions {
  stream?: { write(text: string): void };
}

export function formatTable(rows: TableCell[][], options?: TableOptions): string;
export function printTable(rows: TableCell[][], options?: PrintTableOptions): void;

export type TimestampInput = Date | number | string;

export function formatRelativeTime(value: TimestampInput, options?: { now?: TimestampInput }): string;
export function formatCount(value: number | null | undefined): string;
export function formatDuration(milliseconds: number | null | undefined): string;
export function formatClock(value?: TimestampInput): string;
export function formatLocalTimestamp(value?: TimestampInput): string;
export function formatPercent(fraction: number | null | undefined): string;
