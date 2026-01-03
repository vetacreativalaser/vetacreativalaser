import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { AlertCircle, Settings } from 'lucide-react';

/**
 * Panel de configuración de la tienda
 * Permite pausar compras online y personalizar mensaje
 */
const ShopConfigPanel = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [pauseMessage, setPauseMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const defaultMessage =
    'Las compras online están pausadas temporalmente por mantenimiento de la máquina o periodo de exámenes con poca disposición de tiempo. Si urge demasiado, escríbenos.';

  // Cargar configuración actual
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
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
        setPauseMessage(messageConfig?.value || defaultMessage);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la configuración',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      // Guardar estado de pausa
      const { error: pauseError } = await supabase
        .from('app_config')
        .upsert({
          key: 'shop_paused',
          value: isPaused,
          description: 'Indica si las compras online están pausadas'
        }, {
          onConflict: 'key'
        });

      if (pauseError) throw pauseError;

      // Guardar mensaje de pausa
      const { error: messageError } = await supabase
        .from('app_config')
        .upsert({
          key: 'shop_pause_message',
          value: pauseMessage || defaultMessage,
          description: 'Mensaje mostrado cuando las compras están pausadas'
        }, {
          onConflict: 'key'
        });

      if (messageError) throw messageError;

      toast({
        title: 'Configuración guardada',
        description: `Las compras están ${isPaused ? 'pausadas' : 'activas'}`,
      });
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 shadow border border-gray-200 mb-8"
    >
      <div className="flex items-center text-black mb-6">
        <Settings className="h-7 w-7 mr-3" strokeWidth={1.5} />
        <h2 className="text-2xl font-semibold">Configuración de la Tienda</h2>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Switch para pausar compras */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex-1 mr-4">
            <Label htmlFor="pause-switch" className="text-base font-medium cursor-pointer">
              Pausar compras online
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Deshabilita la opción de tramitar pedidos en la tienda online
            </p>
          </div>
          <Switch
            id="pause-switch"
            checked={isPaused}
            onCheckedChange={setIsPaused}
          />
        </div>

        {/* Mensaje de pausa */}
        <div className="space-y-2">
          <Label htmlFor="pause-message" className="text-base font-medium">
            Mensaje mostrado cuando las compras están pausadas
          </Label>
          <Textarea
            id="pause-message"
            value={pauseMessage}
            onChange={(e) => setPauseMessage(e.target.value)}
            placeholder={defaultMessage}
            className="min-h-[120px]"
            disabled={!isPaused}
          />
          <p className="text-sm text-gray-500">
            Este mensaje se mostrará a los usuarios cuando intenten finalizar su compra
          </p>
        </div>

        {/* Vista previa del mensaje */}
        {isPaused && pauseMessage && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 mb-1">Vista previa del mensaje:</p>
                <p className="text-sm text-amber-800 whitespace-pre-wrap">{pauseMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={saveConfig}
            disabled={isSaving}
            className="bg-black text-white hover:bg-gray-800"
          >
            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
          <Button
            variant="outline"
            onClick={loadConfig}
            disabled={isSaving}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ShopConfigPanel;
