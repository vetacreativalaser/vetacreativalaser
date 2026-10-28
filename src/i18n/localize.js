/**
 * LOCALIZE - Veta Creativa Láser
 *
 * Devuelve el valor de un campo traducido según el idioma.
 * Busca el campo `<nombre>_ca` cuando el idioma es catalán,
 * y cae al campo original (español) si no hay traducción.
 */

export function localize(obj, field, lang) {
  if (!obj) return '';
  if (lang === 'ca') {
    const ca = obj[`${field}_ca`];
    if (ca !== null && ca !== undefined && ca !== '') return ca;
  }
  const val = obj[field];
  return val ?? '';
}
