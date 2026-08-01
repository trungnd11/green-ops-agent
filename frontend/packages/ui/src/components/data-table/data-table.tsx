import { Table } from 'antd';
import { cn } from '@xanh/utils';

export interface DataTableProps<TData extends object> {
  columns: any[];
  dataSource?: TData[];
  isLoading?: boolean;
  rowKey?: string | ((record: TData) => string);
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (record: TData) => void;
  pagination?: any;
  className?: string;
}

export function DataTable<TData extends object>({
  isLoading,
  columns,
  dataSource,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription,
  className,
  onRowClick,
  pagination,
  ...props
}: DataTableProps<TData>) {
  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={isLoading || false}
      rowKey={(props as any).rowKey}
      className={cn('rounded-card', className)}
      locale={{
        emptyText: emptyDescription ? `${emptyTitle}: ${emptyDescription}` : emptyTitle,
      }}
      onRow={(record: any) => ({
        onClick: () => onRowClick?.(record),
        style: { cursor: onRowClick ? 'pointer' : undefined },
      })}
      pagination={
        pagination === false
          ? false
          : {
              showSizeChanger: false,
              showTotal: (total: number, range: number[]) => `${range[0]}-${range[1]} / ${total}`,
              ...pagination,
            }
      }
      {...props}
    />
  );
}
