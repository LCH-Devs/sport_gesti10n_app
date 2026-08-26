'use client';

import { useMemo, useState } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from '@/lib/useTranslation';
import { Pagination } from './Pagination';
import type { Column, DataTableProps, SortState } from './types';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function getValue<T>(column: Column<T>, row: T): unknown {
  if (column.accessor) return column.accessor(row);
  return (row as Record<string, unknown>)[column.key];
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { sensitivity: 'base', numeric: true });
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  mode = 'client',
  loading = false,
  emptyMessage,
  sort: sortProp,
  onSortChange,
  filter: filterProp,
  onFilterChange,
  searchPlaceholder,
  page: pageProp,
  pageSize: pageSizeProp,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  total: totalProp,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  deleteConfirmMessage,
  actions,
  rowClassName,
  className = '',
}: DataTableProps<T>) {
  const { t } = useTranslation();

  const [internalSort, setInternalSort] = useState<SortState | null>(null);
  const [internalFilter, setInternalFilter] = useState('');
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(pageSizeProp ?? DEFAULT_PAGE_SIZE_OPTIONS[0]);

  const sort = sortProp !== undefined ? sortProp : internalSort;
  const filter = filterProp !== undefined ? filterProp : internalFilter;
  const page = pageProp ?? internalPage;
  const pageSize = pageSizeProp ?? internalPageSize;

  const hasActions = Boolean(onEdit || onDelete || actions);

  function handleSortClick(column: Column<T>) {
    if (!column.sortable) return;
    let next: SortState | null;
    if (!sort || sort.key !== column.key) {
      next = { key: column.key, direction: 'asc' };
    } else if (sort.direction === 'asc') {
      next = { key: column.key, direction: 'desc' };
    } else {
      next = null;
    }
    if (onSortChange) onSortChange(next);
    else setInternalSort(next);
  }

  function handleFilterChange(value: string) {
    if (onFilterChange) onFilterChange(value);
    else setInternalFilter(value);
    if (mode === 'client' && pageProp === undefined) setInternalPage(1);
  }

  function handlePageChange(next: number) {
    if (onPageChange) onPageChange(next);
    else setInternalPage(next);
  }

  function handlePageSizeChange(next: number) {
    if (onPageSizeChange) onPageSizeChange(next);
    else setInternalPageSize(next);
    if (pageProp === undefined) setInternalPage(1);
  }

  function handleDelete(row: T) {
    if (!onDelete) return;
    const message =
      typeof deleteConfirmMessage === 'function'
        ? deleteConfirmMessage(row)
        : deleteConfirmMessage ?? t('dataTable.confirmDelete', '¿Eliminar este registro?');
    if (window.confirm(message)) onDelete(row);
  }

  const processedData = useMemo(() => {
    if (mode !== 'client') return data;

    let result = data;

    if (filter.trim()) {
      const needle = filter.trim().toLowerCase();
      const filterableColumns = columns.filter((c) => c.filterable !== false);
      result = result.filter((row) =>
        filterableColumns.some((col) => {
          const value = getValue(col, row);
          return value != null && String(value).toLowerCase().includes(needle);
        }),
      );
    }

    if (sort) {
      const column = columns.find((c) => c.key === sort.key);
      if (column) {
        result = [...result].sort((a, b) => {
          const cmp = compareValues(getValue(column, a), getValue(column, b));
          return sort.direction === 'asc' ? cmp : -cmp;
        });
      }
    }

    return result;
  }, [mode, data, filter, sort, columns]);

  const total = mode === 'client' ? processedData.length : totalProp ?? data.length;

  const pagedData = useMemo(() => {
    if (mode !== 'client') return data;
    const start = (page - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [mode, data, processedData, page, pageSize]);

  const rows = mode === 'client' ? pagedData : data;

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
      <div className="flex items-center gap-2 border-b border-slate-200 p-3">
        <div className="relative w-full max-w-xs">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            placeholder={searchPlaceholder ?? t('dataTable.search', 'Buscar...')}
            className="w-full rounded-md border border-slate-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-600">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={column.width ? { width: column.width } : undefined}
                  className={`px-4 py-3 font-medium ${
                    column.align === 'right'
                      ? 'text-right'
                      : column.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                  } ${column.sortable ? 'cursor-pointer select-none hover:text-slate-900' : ''}`}
                  onClick={() => handleSortClick(column)}
                >
                  <span className="inline-flex items-center gap-1">
                    {column.header}
                    {column.sortable &&
                      (sort?.key === column.key ? (
                        sort.direction === 'asc' ? (
                          <ChevronUpIcon className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDownIcon className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronUpDownIcon className="h-3.5 w-3.5 text-slate-300" />
                      ))}
                  </span>
                </th>
              ))}
              {hasActions && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-8 text-center text-slate-500">
                  {t('common.loading', 'Cargando...')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-8 text-center text-slate-500">
                  {emptyMessage ?? t('messages.noData', 'Sin resultados')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={getRowId(row)}
                  className={`border-b last:border-0 hover:bg-slate-50 ${rowClassName ? rowClassName(row) : ''}`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 ${
                        column.align === 'right'
                          ? 'text-right'
                          : column.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                      }`}
                    >
                      {column.render ? column.render(row) : String(getValue(column, row) ?? '')}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        {actions?.(row)}
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(row)}
                            className="text-slate-500 hover:text-blue-600"
                            aria-label={t('dataTable.edit', 'Editar')}
                            title={t('dataTable.edit', 'Editar')}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            className="text-slate-500 hover:text-red-600"
                            aria-label={t('dataTable.delete', 'Eliminar')}
                            title={t('dataTable.delete', 'Eliminar')}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        pageSizeOptions={pageSizeOptions}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
