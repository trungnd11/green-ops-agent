import { Pagination as AntPagination } from 'antd';
import { cn } from '@xanh/utils';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  return (
    <AntPagination
      current={page}
      total={totalPages * 10}
      pageSize={10}
      onChange={onPageChange as any}
      className={cn(className)}
      showSizeChanger={false}
    />
  );
}
