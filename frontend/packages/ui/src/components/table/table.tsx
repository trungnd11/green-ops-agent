import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Table as AntTable, ConfigProvider, theme } from 'antd';
import { cn } from '@xanh/utils';
import type { TableProps as AntTableProps } from 'antd';

export interface TableColumn<T = any> {
  title?: string;
  dataIndex?: string;
  key?: string;
  width?: number | string;
  fixed?: 'left' | 'right';
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sorter?: boolean | ((a: T, b: T) => number);
  sortOrder?: 'ascend' | 'descend' | null;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableProps<T extends object = any> extends Omit<AntTableProps<T>, 'columns' | 'dataSource' | 'loading' | 'pagination'> {
  columns: TableColumn<T>[];
  dataSource?: T[];
  isLoading?: boolean;
  rowKey?: string | ((record: T) => string);
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (record: T) => void;
  pagination?: any;
  bordered?: boolean;
  size?: 'small' | 'middle' | 'large';
  scroll?: { x?: number | string; y?: number | string };
  sortBy?: string;
  sortOrder?: 'ascend' | 'descend';
  onSort?: (field: string, order: 'ascend' | 'descend') => void;
  autoHeight?: boolean;
}

const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorBgContainer: '#1C2737',
    colorBorderSecondary: 'rgba(255,255,255,0.08)',
    colorText: '#F8FAFC',
    colorTextSecondary: '#8792A2',
    borderRadius: 12,
    controlHeightSM: 32,
  },
  components: {
    Table: {
      headerBg: 'transparent',
      headerColor: '#8792A2',
      borderColor: 'rgba(255,255,255,0.08)',
      rowHoverBg: '#101B2B',
      colorBgContainer: 'transparent',
    },
  },
};

export function Table<T extends object = any>({
  isLoading,
  columns,
  dataSource,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription,
  className,
  onRowClick,
  pagination,
  rowKey,
  autoHeight,
  ...rest
}: TableProps<T>) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [tableScrollY, setTableScrollY] = useState<number | undefined>(undefined);
  const hasPagination = pagination !== false && !isLoading;

  const calc = useCallback(() => {
    if (!autoHeight || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const scrollY = window.innerHeight - rect.top - (hasPagination ? 100 : 50);
    setTableScrollY(Math.max(200, Math.floor(scrollY)));
  }, [autoHeight, hasPagination]);

  useLayoutEffect(() => {
    if (!autoHeight) return;
    calc();
  }, [autoHeight, calc]);

  useEffect(() => {
    if (!autoHeight) return;

    const observer = new ResizeObserver(() => calc());
    if (wrapperRef.current) observer.observe(wrapperRef.current);

    window.addEventListener('resize', calc);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', calc);
    };
  }, [autoHeight, calc]);

  const skeletonColumns = columns.map((col) => ({
    ...col,
    render: () => (
      <div className="animate-pulse">
        <div className="h-4 rounded" style={{ background: '#3A4352', width: '70%' }} />
      </div>
    ),
  }));

  const skeletonData = Array.from({ length: isLoading ? 3 : 0 }).map((_, i) => ({ id: `skel-${i}` })) as any;

  const mergedScroll: { x?: number | string; y?: number | string } = {};
  if (autoHeight && tableScrollY !== undefined) mergedScroll.y = tableScrollY;
  if (rest.scroll?.x) mergedScroll.x = rest.scroll.x;

  const tableStyle: React.CSSProperties = autoHeight ? { flex: 1, minHeight: 0 } : {};

  return (
    <ConfigProvider theme={darkTheme}>
      <div ref={wrapperRef} className={cn('flex flex-col', autoHeight && 'min-h-0 flex-1', className)}>
        <div ref={tableRef} className={autoHeight ? 'flex flex-col min-h-0 flex-1' : ''}>
          <AntTable<T>
            {...rest}
            style={tableStyle}
            columns={(isLoading ? skeletonColumns : columns) as any}
            dataSource={(isLoading ? skeletonData : dataSource) as any}
            loading={false}
            rowKey={(isLoading ? 'id' : rowKey) as any}
            locale={{
              emptyText: isLoading
                ? null
                : emptyDescription
                  ? `${emptyTitle}: ${emptyDescription}`
                  : emptyTitle,
            }}
            onRow={(record: any) => ({
              onClick: () => !isLoading && onRowClick?.(record),
              style: { cursor: onRowClick ? 'pointer' : undefined },
            })}
            pagination={
              isLoading
                ? false
                : pagination === false
                  ? false
                  : {
                      showSizeChanger: { size: 'small' },
                      pageSizeOptions: ['5', '10', '20', '50'],
                      size: 'small',
                      showTotal: (total: number, range: number[]) =>
                        `${range[0]}-${range[1]} / ${total.toLocaleString('vi-VN')}`,
                      ...pagination,
                    }
            }
            scroll={mergedScroll}
          />
        </div>
      </div>
    </ConfigProvider>
  );
}
