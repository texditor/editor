export interface TableRowSchema {
    cells: Array<{
        type: 'th' | 'td';
        content: string;
        align?: string
    }>;
}

export type TableColumnAlign = 'left' | 'center' | 'right';