/**
 * STRIPE CLIENT - Veta Creativa Láser
 *
 * Wrapper para cargar Stripe.js usando el patrón Singleton
 * para evitar múltiples cargas de la librería y mejorar el rendimiento.
 */

import { loadStripe } from '@stripe/stripe-js';

// Variable para almacenar la promesa de Stripe (Singleton)
let stripePromise = null;

/**
 * Obtiene la instancia de Stripe
 *
 * Usa el patrón Singleton para cargar Stripe.js solo una vez.
 * La clave pública se obtiene desde las variables de entorno.
 *
 * @returns {Promise<Stripe|null>} - Instancia de Stripe o null si falta la clave
 *
 * @example
 * const stripe = await getStripe();
 * if (stripe) {
 *   await stripe.redirectToCheckout({ sessionId });
 * }
 */
export function getStripe() {
  // Si ya se cargó, devolver la promesa existente
  if (stripePromise) {
    return stripePromise;
  }

  // Obtener la clave pública desde variables de entorno
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

  // Validar que existe la clave
  if (!publicKey) {
    console.error('VITE_STRIPE_PUBLIC_KEY no está definida en .env');
    return Promise.resolve(null);
  }

  // Cargar Stripe y almacenar la promesa
  stripePromise = loadStripe(publicKey);

  return stripePromise;
}
