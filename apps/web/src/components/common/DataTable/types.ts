import { ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (row: T) => ReactNode;
  accessor?: (row: T) => string | number | null | undefined;
}

export type DataTableMode = 'client' | 'server';

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowId: (row: T) => string | number;
  mode?: DataTableMode;

  loading?: boolean;
  emptyMessage?: string;

  /** Sorting. Uncontrolled (client mode) if sort/onSortChange are omitted. */
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;

  /** Global search filter. Uncontrolled (client mode) if filter/onFilterChange are omitted. */
  filter?: string;
  onFilterChange?: (filter: string) => void;
  searchPlaceholder?: string;

  /** Pagination. Uncontrolled (client mode) if page/onPageChange are omitted. */
  page?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;

  /** Row actions */
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  deleteConfirmMessage?: string | ((row: T) => string);
  actions?: (row: T) => ReactNode;

  rowClassName?: (row: T) => string;
  className?: string;
}
