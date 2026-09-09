'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronRightIcon,
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
  groupBy,
  groupEmptyLabel,
  groupSortKey = 'familia',
  toolbar,
  renderExpanded,
  expandedRowId: expandedRowIdProp,
  onExpandedChange,
}: DataTableProps<T>) {
  const { t } = useTranslation();

  const [internalSort, setInternalSort] = useState<SortState | null>(null);
  const [internalFilter, setInternalFilter] = useState('');
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(pageSizeProp ?? DEFAULT_PAGE_SIZE_OPTIONS[0]);
  const [internalExpanded, setInternalExpanded] = useState<string | number | null>(null);

  const sort = sortProp !== undefined ? sortProp : internalSort;
  const filter = filterProp !== undefined ? filterProp : internalFilter;
  const page = pageProp ?? internalPage;
  const pageSize = pageSizeProp ?? internalPageSize;
  const expandedId =
    expandedRowIdProp !== undefined ? expandedRowIdProp : internalExpanded;

  const hasActions = Boolean(onEdit || onDelete || actions);
  const hasExpand = Boolean(renderExpanded);
  const colCount = columns.length + (hasActions ? 1 : 0) + (hasExpand ? 1 : 0);

  function toggleExpanded(id: string | number) {
    const next = expandedId === id ? null : id;
    if (onExpandedChange) onExpandedChange(next);
    else setInternalExpanded(next);
  }

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
      const sortRows = (list: T[]) => {
        if (!column || (groupBy && sort.key === groupSortKey)) return list;
        return [...list].sort((a, b) => {
          const cmp = compareValues(getValue(column, a), getValue(column, b));
          return sort.direction === 'asc' ? cmp : -cmp;
        });
      };

      if (groupBy) {
        const buckets = new Map<string, { order: string | number; rows: T[] }>();
        const ungrouped: T[] = [];
        for (const row of result) {
          const g = groupBy(row);
          if (!g) {
            ungrouped.push(row);
            continue;
          }
          const bucket = buckets.get(g.key) ?? { order: g.order ?? String(g.key), rows: [] };
          bucket.rows.push(row);
          buckets.set(g.key, bucket);
        }
        const groupDir =
          sort.key === groupSortKey && sort.direction === 'desc' ? -1 : 1;
        const groups = [...buckets.entries()].sort((a, b) =>
          groupDir * compareValues(a[1].order, b[1].order),
        );
        result = [
          ...groups.flatMap(([, b]) => sortRows(b.rows)),
          ...sortRows(ungrouped),
        ];
      } else {
        result = sortRows(result);
      }
    } else if (groupBy) {
      const buckets = new Map<string, { order: string | number; rows: T[] }>();
      const ungrouped: T[] = [];
      for (const row of result) {
        const g = groupBy(row);
        if (!g) {
          ungrouped.push(row);
          continue;
        }
        const bucket = buckets.get(g.key) ?? { order: g.order ?? String(g.key), rows: [] };
        bucket.rows.push(row);
        buckets.set(g.key, bucket);
      }
      const groups = [...buckets.values()].sort((a, b) =>
        compareValues(a.order, b.order),
      );
      result = [...groups.flatMap((b) => b.rows), ...ungrouped];
    }

    return result;
  }, [mode, data, filter, sort, columns, groupBy, groupSortKey]);

  useEffect(() => {
    if (expandedId == null || mode !== 'client' || pageProp !== undefined) return;
    const idx = processedData.findIndex(
      (row) => String(getRowId(row)) === String(expandedId),
    );
    if (idx < 0) return;
    const nextPage = Math.floor(idx / pageSize) + 1;
    if (nextPage !== page) setInternalPage(nextPage);
  }, [expandedId, processedData, pageSize, mode, getRowId, page, pageProp]);

  const total = mode === 'client' ? processedData.length : totalProp ?? data.length;

  const pagedData = useMemo(() => {
    if (mode !== 'client') return data;
    const start = (page - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [mode, data, processedData, page, pageSize]);

  const rows = mode === 'client' ? pagedData : data;

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
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
        {toolbar}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-600">
            <tr>
              {hasExpand && <th className="w-10 px-2 py-3" />}
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
                <td colSpan={colCount} className="px-4 py-8 text-center text-slate-500">
                  {t('common.loading', 'Cargando...')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-8 text-center text-slate-500">
                  {emptyMessage ?? t('messages.noData', 'Sin resultados')}
                </td>
              </tr>
            ) : (
              rows.flatMap((row, index) => {
                const group = groupBy?.(row) ?? null;
                const groupKey = group?.key ?? '__none__';
                const prev = index > 0 ? groupBy?.(rows[index - 1]) : undefined;
                const prevKey = index === 0 ? null : (prev?.key ?? '__none__');
                const showGroup =
                  Boolean(groupBy) && (index === 0 || groupKey !== prevKey);
                const label =
                  group?.label ??
                  groupEmptyLabel ??
                  t('dataTable.ungrouped', 'Sin grupo');
                const nodes = [];
                if (showGroup) {
                  nodes.push(
                    <tr key={`g-${groupKey}-${getRowId(row)}`} className="bg-slate-100">
                      <td
                        colSpan={colCount}
                        className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        {label}
                      </td>
                    </tr>,
                  );
                }
                const rowId = getRowId(row);
                const isExpanded = hasExpand && String(expandedId) === String(rowId);
                nodes.push(
                  <tr
                    key={rowId}
                    id={`datatable-row-${rowId}`}
                    className={`border-b last:border-0 hover:bg-slate-50 ${isExpanded ? 'bg-slate-50' : ''} ${rowClassName ? rowClassName(row) : ''}`}
                  >
                    {hasExpand && (
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(rowId)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                          aria-expanded={isExpanded}
                          aria-label={
                            isExpanded
                              ? t('dataTable.collapse', 'Contraer')
                              : t('dataTable.expand', 'Desplegar')
                          }
                          title={
                            isExpanded
                              ? t('dataTable.collapse', 'Contraer')
                              : t('dataTable.expand', 'Desplegar')
                          }
                        >
                          {isExpanded ? (
                            <ChevronDownIcon className="h-4 w-4" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    )}
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
                  </tr>,
                );
                if (isExpanded && renderExpanded) {
                  nodes.push(
                    <tr key={`exp-${rowId}`} className="border-b bg-slate-50">
                      <td colSpan={colCount} className="px-4 py-3">
                        {renderExpanded(row)}
                      </td>
                    </tr>,
                  );
                }
                return nodes;
              })
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
