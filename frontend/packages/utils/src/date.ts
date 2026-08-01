function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}
