import { BlockModel, BlockModelConfig } from '@/types';

export interface TableRowSchema {
  cells: Array<{
    type: 'th' | 'td';
    content: string;
    align?: string;
  }>;
}

export type TableColumnAlign = 'left' | 'center' | 'right';

/**
 * Configuration options for the table block.
 */
export interface TableBlockModelConfig extends BlockModelConfig {
  /**
   * The default number of rows created when a new table block is inserted.
   * @default 3
   */
  defaultRows: number;

  /**
   * The default number of columns created when a new table block is inserted.
   * @default 3
   */
  defaultCols: number;

  /**
   * The maximum number of rows allowed in the table.
   * Users cannot add more rows once this limit is reached.
   * @default 100
   */
  maxRows: number;

  /**
   * The maximum number of columns allowed in the table.
   * Users cannot add more columns once this limit is reached.
   * @default 10
   */
  maxCols: number;

  /**
   * Whether the table should include a header row by default.
   * @default true
   */
  withHeader: boolean;
}

/**
 * Table block model interface
 * Defines the public API for table block instances
 */
export interface TableBlockModel extends BlockModel {
  /**
   * Returns the unique identifier for this event listener instance
   * @returns The unique event ID string used to identify and manage event listeners
   */
  getDefaultRows(): number;

  /**
   * Returns the default number of columns used when a new table is created.
   * @returns The default column count configured for the table block.
   */
  getDefaultCols(): number;

  /**
   * Returns the maximum number of rows allowed in the table.
   * @returns The upper limit for the row count.
   */
  getMaxRows(): number;

  /**
   * Returns the maximum number of columns allowed in the table.
   * @returns The upper limit for the column count.
   */
  getMaxCols(): number;

  /**
   * Indicates whether the table is rendered with a header row.
   * @returns `true` if the table has a header row, otherwise `false`.
   */
  getWithHeader(): boolean;
}
