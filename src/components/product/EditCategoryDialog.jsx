// NUEVO COMPONENTE: EditCategoryDialog.jsx
import React, { useState, useCallback, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { getCroppedImg } from '@/lib/cropImage';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle, Loader2 } from 'lucide-react';

const EditCategoryDialog = ({ isOpen, setIsOpen, category, onSuccess }) => {
  const [title, setTitle] = useState(category?.title || '');
  const [description, setDescription] = useState(category?.description || '');
  const [imageSrc, setImageSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setTitle(category?.title || '');
    setDescription(category?.description || '');
  }, [category]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      let imageUrl = category.image_url;

      if (imageSrc) {
        const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
        const compressed = await imageCompression(croppedBlob, {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 800,
          fileType: 'image/webp',
        });

        const fileName = `categoria-${Date.now()}.webp`;
        const { error: uploadError } = await supabase
          .storage
          .from('categorias')
          .upload(fileName, compressed, { contentType: 'image/webp' });

        if (uploadError) {
          console.error('Error subiendo imagen:', uploadError);
          return;
        }

        const { data: urlData } = supabase.storage.from('categorias').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('categorias')
        .update({
          title,
          description,
          image_url: imageUrl,
          categoria: title.toLowerCase().replace(/\s+/g, '-'),
          filter: title.toLowerCase().replace(/\s+/g, '-')
        })
        .eq('id', category.id);

      if (updateError) {
        console.error('Error actualizando categoría:', updateError);
        return;
      }

      // Actualizar productos vinculados
      await supabase.from('products')
        .update({ category_name: title })
        .eq('category_id', category.id);

      onSuccess?.();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Error general:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Categoría</DialogTitle>
          <DialogDescription>Modifica la categoría y guarda los cambios.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <textarea
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />

          {!imageSrc ? (
            <input type="file" accept="image/*" onChange={handleImageChange} />
          ) : (
            <div className="relative w-full h-60 bg-gray-100 rounded overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1 / 1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
          )}

          {imageSrc && (
            <div className="mt-2">
              <label className="text-sm text-gray-600">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2 items-center">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleUpdate} disabled={loading || !title || !description}>
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : success ? <CheckCircle className="text-green-500 w-4 h-4 mr-2" /> : null}
            {success ? 'Actualizado' : loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog.Root>
  );
};

export default EditCategoryDialog;
