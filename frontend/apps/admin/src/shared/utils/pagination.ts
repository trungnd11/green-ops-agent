export function buildPagination(
  page: number,
  pageSize: number,
  total: number,
  onPageChange: (page: number) => void,
  onPageSizeChange: (size: number) => void
) {
  return {
    current: page + 1,
    pageSize,
    total,
    onChange: (p: number, size: number) => {
      if (size !== pageSize) onPageSizeChange(size);
      else onPageChange(p - 1);
    },
    showSizeChanger: { size: 'small' },
    pageSizeOptions: ["5", "10", "20", "50"],
    size: 'small',
    showTotal: (total: number, range: number[]) => `Đang xem ${range[0]} - ${range[1]} tổng ${total.toLocaleString("vi-VN")}`,
  };
}
