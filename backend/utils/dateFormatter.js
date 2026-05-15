export function formatOrdinalDate(value) {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? 'st' :
    day % 10 === 2 && day !== 12 ? 'nd' :
    day % 10 === 3 && day !== 13 ? 'rd' :
    'th';

  return `${day}${suffix} ${date.toLocaleString('en-IN', { month: 'long' })}, ${date.getFullYear()}`;
}
