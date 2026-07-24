import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PAGE_SIZE_OPTIONS } from '@/constants/enums';
import { PaginationMeta } from '@/types/auditLog.types';

interface PaginationProps {
  meta: PaginationMeta;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({ meta, limit, onPageChange, onLimitChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span>
          Showing{' '}
          <span className="text-text-secondary font-medium">
            {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.totalCount)}
          </span>{' '}
          of <span className="text-text-secondary font-medium">{meta.totalCount.toLocaleString()}</span>
        </span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="ml-2 rounded-md border border-border bg-base-800 px-2 py-1 text-xs text-text-secondary focus:outline-none"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!meta.hasPrevPage}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft size={14} />
          Prev
        </Button>
        <span className="text-xs text-text-muted px-2">
          Page {meta.page} of {meta.totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
