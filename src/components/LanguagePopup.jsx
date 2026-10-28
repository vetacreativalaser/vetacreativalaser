/**
 * LANGUAGE POPUP - Veta Creativa Láser
 *
 * Popup de selección de idioma que aparece al cargar la web
 * si el usuario aún no ha elegido idioma.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const LanguagePopup = () => {
  const { language, setLanguage } = useLanguage();

  // Se muestra solo si no hay idioma guardado
  const open = language === null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Elige tu idioma · Tria el teu idioma</DialogTitle>
          <DialogDescription>
            Selecciona el idioma en el que quieres ver la web.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          <Button
            className="w-full"
            onClick={() => setLanguage('es')}
          >
            🇪🇸 Castellano
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => setLanguage('ca')}
          >
            🇪🇸 Català
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LanguagePopup;
