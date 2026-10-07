import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: keyof T & string
  header: string
  cell?: (row: T) => ReactNode
  className?: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  unit?: string
  onPageChange: (page: number) => void
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  pagination?: Pagination
  loading?: boolean
  empty?: { title: string; description?: string; action?: ReactNode }
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  pagination,
  loading = false,
  empty = { title: '데이터가 없습니다' },
}: DataTableProps<T>) {
  const isEmpty = !loading && rows.length === 0

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn('text-xs font-semibold text-muted-foreground', column.className)}
                >
                  {column.header}
                </TableHead>
              ))}
              {/* 행 클릭이 되는 표는 오른쪽 끝에 > 아이콘 칸을 둔다 */}
              {onRowClick && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading &&
              Array.from({ length: 5 }, (_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      <Skeleton className="h-4 w-full max-w-24" />
                    </TableCell>
                  ))}
                  {onRowClick && <TableCell />}
                </TableRow>
              ))}

            {!loading &&
              rows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && 'group cursor-pointer')}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.cell ? column.cell(row) : String(row[column.key] ?? '-')}
                    </TableCell>
                  ))}
                  {onRowClick && (
                    <TableCell className="w-10 pl-0 text-right">
                      <ChevronRight
                        aria-hidden
                        className="ml-auto size-4 text-border transition-colors group-hover:text-primary"
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {isEmpty && (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyTitle>{empty.title}</EmptyTitle>
              {empty.description && <EmptyDescription>{empty.description}</EmptyDescription>}
            </EmptyHeader>
            {empty.action && <EmptyContent>{empty.action}</EmptyContent>}
          </Empty>
        )}
      </div>

      {pagination && pagination.total > 0 && <TablePagination {...pagination} />}
    </div>
  )
}

function TablePagination({ page, pageSize, total, unit = '건', onPageChange }: Pagination) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <p>
        전체 {total}
        {unit} 중 {from}–{to}
        {unit} 표시
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          이전
        </Button>
        <span className="tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          다음
        </Button>
      </div>
    </div>
  )
}
