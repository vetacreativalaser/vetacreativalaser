/**
 * WhatsApp Helpers - Veta Creativa Láser
 *
 * Funciones para generar mensajes y enlaces de WhatsApp
 * con el contenido del carrito (pedido para recoger en Vendrell).
 */

import { calculateItemTotal, formatPrice } from './priceUtils';
import { localize } from '../i18n/localize';

export const WHATSAPP_NUMBER = '642571133';

/**
 * Construye el mensaje de texto con todos los productos del carrito
 *
 * @param {Array} items - Items del carrito (desde el store de Zustand)
 * @param {string} lang - Idioma ('es' o 'ca')
 * @returns {string} - Mensaje listo para WhatsApp
 */
export function buildCartMessage(items, lang = 'es') {
  const lines = items.map((item) => {
    const name = localize(item.product, 'name', lang) || 'Producto';
    const qty = item.quantity || 1;
    let line = `- ${qty} x ${name}`;

    if (item.selectedReason) {
      line += ` (${item.selectedReason})`;
    }

    if (item.customization && Object.keys(item.customization).length > 0) {
      const cust = Object.entries(item.customization)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      line += ` — ${cust}`;
    }

    try {
      if (item.priceConfig && item.priceConfig.type) {
        const total = calculateItemTotal(item.priceConfig, qty, item.selectedReason);
        line += ` [${formatPrice(total)}]`;
      }
    } catch (e) {
      // Ignorar errores de precio, no bloquear el mensaje
    }

    return line;
  });

  const intro = lang === 'ca'
    ? 'Hola! M\u2019agradaria encarregar aquests productes per recollir al Vendrell (pagament en efectiu o Bizum en recollir-los):'
    : 'Hola! Me gustaría encargar estos productos para recoger en Vendrell (pago en efectivo o Bizum al recibirlos):';
  const outro = lang === 'ca' ? 'Gràcies!' : 'Gracias!';

  return `${intro}\n\n${lines.join('\n')}\n\n${outro}`;
}

/**
 * Genera el enlace wa.me con el mensaje del carrito
 *
 * @param {Array} items - Items del carrito
 * @param {string} lang - Idioma ('es' o 'ca')
 * @returns {string} - URL de WhatsApp
 */
export function buildWhatsAppLink(items, lang = 'es') {
  const message = buildCartMessage(items, lang);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
