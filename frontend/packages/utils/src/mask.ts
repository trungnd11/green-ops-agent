export function maskCCCD(id: string): string {
  if (id.length < 8) return id;
  return `${id.slice(0, 4)}•••••${id.slice(-3)}`;
}

export function maskBankAccount(accountNumber: string): string {
  if (accountNumber.length < 4) return accountNumber;
  return `•••• ${accountNumber.slice(-4)}`;
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 7) return phone;
  return `${cleaned.slice(0, 4)} ••• ${cleaned.slice(-3)}`;
}
