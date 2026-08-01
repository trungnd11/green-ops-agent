export function formatCurrency(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('vi-VN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${formatted} ₫`;
}

export function formatNegativeCurrency(amount: number): string {
  const formatted = formatCurrency(amount);
  return amount < 0 ? `-${formatted}` : formatted;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}%`;
}
