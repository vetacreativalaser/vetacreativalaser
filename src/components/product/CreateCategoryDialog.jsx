import React, { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { getCroppedImg } from '@/lib/cropImage';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle, Loader2 } from 'lucide-react';

const CreateCategoryDialog = ({ isOpen, setIsOpen, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageSrc, setImageSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const handleCreate = async () => {
    setLoading(true);
    try {
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

      const { data, error: insertError } = await supabase
        .from('categorias')
        .insert([
          {
            title,
            description,
            image_url: urlData.publicUrl,
            categoria: title.toLowerCase().replace(/\s+/g, '-'),
            filter: title.toLowerCase().replace(/\s+/g, '-')
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error creando categoría:', insertError);
        return;
      }

      onSuccess?.(data);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 1200);

      setTitle('');
      setDescription('');
      setImageSrc(null);
      setZoom(1);
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
          <DialogTitle>Crear Nueva Categoría</DialogTitle>
          <DialogDescription>Rellena los campos para añadir una categoría nueva.</DialogDescription>
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
          <Button onClick={handleCreate} disabled={loading || !title || !description || !imageSrc}>
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : success ? <CheckCircle className="text-green-500 w-4 h-4 mr-2" /> : null}
            {success ? 'Creado' : loading ? 'Creando...' : 'Crear Categoría'}
          </Button>
        </div>
      </DialogContent>
    </Dialog.Root>
  );
};

export default CreateCategoryDialog;
