/**
 * Utilidades para manejo de imágenes
 */

/**
 * Extrae la ruta de un archivo desde una URL de Supabase Storage
 *
 * @param {string} url - URL completa de Supabase Storage
 * @param {string} bucket - Nombre del bucket (ej: 'productos', 'reviews', 'categorias')
 * @returns {string|null} - Ruta del archivo o null si no se puede parsear
 *
 * @example
 * const url = 'https://...supabase.co/storage/v1/object/public/productos/image-123.webp'
 * const path = extractImagePath(url, 'productos') // 'image-123.webp'
 */
export function extractImagePath(url, bucket) {
  try {
    const urlObj = new URL(url);
    const pathPattern = `/storage/v1/object/public/${bucket}/`;
    const pathIndex = urlObj.pathname.indexOf(pathPattern);

    if (pathIndex === -1) return null;

    const path = urlObj.pathname.substring(pathIndex + pathPattern.length);
    return decodeURIComponent(path);
  } catch (error) {
    console.error('Error parsing image URL:', error);
    return null;
  }
}

/**
 * Extrae múltiples rutas de imágenes desde URLs
 *
 * @param {string[]} urls - Array de URLs de Supabase Storage
 * @param {string} bucket - Nombre del bucket
 * @returns {string[]} - Array de rutas extraídas (filtra nulls)
 *
 * @example
 * const urls = ['https://.../productos/img1.webp', 'https://.../productos/img2.webp']
 * const paths = extractImagePaths(urls, 'productos') // ['img1.webp', 'img2.webp']
 */
export function extractImagePaths(urls, bucket) {
  if (!Array.isArray(urls)) return [];
  return urls
    .map(url => extractImagePath(url, bucket))
    .filter(Boolean);
}

/**
 * Parsea image_urls que puede venir como string JSON o array
 *
 * @param {string|Array} imageUrls - URLs de imágenes en formato JSON string o array
 * @returns {Array} - Array de URLs parseado
 *
 * @example
 * parseImageUrls('["url1", "url2"]') // ['url1', 'url2']
 * parseImageUrls(['url1', 'url2']) // ['url1', 'url2']
 */
export function parseImageUrls(imageUrls) {
  if (!imageUrls) return [];
  if (Array.isArray(imageUrls)) return imageUrls;

  try {
    return typeof imageUrls === 'string' ? JSON.parse(imageUrls) : [];
  } catch (error) {
    console.error('Error parsing image URLs:', error);
    return [];
  }
}
