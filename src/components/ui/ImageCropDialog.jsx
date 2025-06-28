import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { getCroppedImg } from '@/lib/cropImage';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

const ImageCropDialog = ({ open, onClose, onConfirm }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => setImageSrc(reader.result));
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);

      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const compressed = await imageCompression(croppedBlob, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1000,
        fileType: 'image/webp',
      });

      const newName = `banner-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from('portadacategorias')
        .upload(newName, compressed, { contentType: 'image/webp' });

      if (uploadError) {
        console.error("❌ Error subiendo nueva imagen:", uploadError);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('portadacategorias')
        .getPublicUrl(newName);

      const publicUrl = urlData.publicUrl;

      const { data: allImages, error: listError } = await supabase
        .storage
        .from('portadacategorias')
        .list('', { limit: 1000 });

      if (listError) {
        console.error("❌ Error al listar imágenes:", listError);
      } else {
        const toDelete = allImages
          .map((img) => img.name)
          .filter((name) => name !== newName);

        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .storage
            .from('portadacategorias')
            .remove(toDelete);

          if (deleteError) {
            console.error("❌ Error al eliminar imágenes antiguas:", deleteError);
          }
        }
      }

      const altText = 'Imagen recortada de banner Veta Creativa';
      await onConfirm(publicUrl, altText);

      setImageSrc(null);
      onClose();

    } catch (err) {
      console.error('❌ Error general al guardar imagen:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-w-xl w-[90vw] bg-white p-6 rounded-xl shadow-xl -translate-x-1/2 -translate-y-1/2">
          <Dialog.Title className="text-lg font-semibold mb-4">
            Recortar nueva imagen
          </Dialog.Title>

          {!imageSrc ? (
            <input type="file" accept="image/*" onChange={handleFileChange} />
          ) : (
            <div className="relative w-full h-64 bg-gray-100 rounded overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={3 / 2}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
          )}

          {imageSrc && (
            <>
              <div className="mt-4">
                <label className="text-sm text-gray-600">Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ImageCropDialog;
