export function formatDeadline(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export function maskDeadline(value, caret = value.length, deleting = false) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const beforeCaret = Math.min(value.slice(0, caret).replace(/\D/g, '').length, digits.length);
  let formatted = digits.slice(0, 2);
  if (digits.length >= 2) formatted += '/' + digits.slice(2, 4);
  if (digits.length >= 4) formatted += '/' + digits.slice(4);
  let position = 0, seen = 0;
  while (position < formatted.length && seen < beforeCaret) {
    if (/\d/.test(formatted[position])) seen++;
    position++;
  }
  if (!deleting && formatted[position] === '/') position++;
  return { value: formatted, caret: position };
}

export function parseDeadline(value) {
  const text = value.trim();
  if (!text) return null;
  const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!parts) throw new Error('Informe o prazo no formato DD/MM/AAAA.');
  const [, day, month, year] = parts;
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
  if (Number(year) < 1 || date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) {
    throw new Error('Informe uma data de prazo válida.');
  }
  return `${year}-${month}-${day}`;
}
