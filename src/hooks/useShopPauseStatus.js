import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook para verificar si las compras online están pausadas
 *
 * @returns {Object} { isPaused, pauseMessage, isLoading }
 */
export function useShopPauseStatus() {
  const [isPaused, setIsPaused] = useState(false);
  const [pauseMessage, setPauseMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPauseStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('key, value')
          .in('key', ['shop_paused', 'shop_pause_message']);

        if (error) throw error;

        if (data) {
          const pausedConfig = data.find(c => c.key === 'shop_paused');
          const messageConfig = data.find(c => c.key === 'shop_pause_message');

          setIsPaused(pausedConfig?.value === true || pausedConfig?.value === 'true');
          setPauseMessage(messageConfig?.value || '');
        }
      } catch (error) {
        console.error('Error cargando estado de pausa:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPauseStatus();

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('shop_pause_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_config',
          filter: 'key=in.(shop_paused,shop_pause_message)'
        },
        () => {
          loadPauseStatus();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isPaused, pauseMessage, isLoading };
}
