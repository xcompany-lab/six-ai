/**
 * Formats a raw input string into Brazilian Real currency format (R$ 1.234,56).
 * Only keeps digits, treats as centavos.
 */
export function formatCurrency(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const amount = Number(digits) / 100;
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Displays a saved price value formatted as R$.
 * Handles already-formatted strings, plain numbers, etc.
 */
export function displayCurrency(value: string | undefined | null): string {
  if (!value || !value.trim()) return '—';
  // Already formatted
  if (value.startsWith('R$')) return value;
  // Try parsing as number
  const num = Number(value.replace(',', '.'));
  if (!isNaN(num) && num > 0) {
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
  return value;
}
