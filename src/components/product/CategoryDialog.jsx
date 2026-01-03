import React, { useState, useCallback, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { getCroppedImg } from '@/lib/cropImage';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle, Loader2 } from 'lucide-react';

/**
 * Componente unificado para crear y editar categorías
 *
 * @param {boolean} isOpen - Estado del diálogo
 * @param {Function} setIsOpen - Función para cambiar estado del diálogo
 * @param {Object|null} category - Categoría a editar (null para crear nueva)
 * @param {Function} onSuccess - Callback cuando se completa exitosamente
 */
const CategoryDialog = ({ isOpen, setIsOpen, category = null, onSuccess }) => {
  const isEditMode = Boolean(category);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageSrc, setImageSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize form with category data when editing
  useEffect(() => {
    if (category) {
      setTitle(category.title || '');
      setDescription(category.description || '');
    } else {
      setTitle('');
      setDescription('');
      setImageSrc(null);
      setZoom(1);
    }
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

  const uploadImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return null;

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
      throw uploadError;
    }

    const { data: urlData } = supabase.storage.from('categorias').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const imageUrl = await uploadImage();

      const { data, error: insertError } = await supabase
        .from('categorias')
        .insert([
          {
            title,
            description,
            image_url: imageUrl,
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
        resetForm();
      }, 1200);
    } catch (err) {
      console.error('Error general:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      let imageUrl = category.image_url;

      if (imageSrc) {
        imageUrl = await uploadImage();
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

      // Update linked products
      await supabase.from('products')
        .update({ category_name: title })
        .eq('category_id', category.id);

      onSuccess?.();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        resetForm();
      }, 1200);
    } catch (err) {
      console.error('Error general:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
  };

  const handleSubmit = () => {
    if (isEditMode) {
      handleUpdate();
    } else {
      handleCreate();
    }
  };

  const isFormValid = () => {
    if (!title || !description) return false;
    if (isEditMode) return true; // Image is optional when editing
    return Boolean(imageSrc); // Image is required when creating
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Categoría' : 'Crear Nueva Categoría'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifica la categoría y guarda los cambios.'
              : 'Rellena los campos para añadir una categoría nueva.'}
          </DialogDescription>
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
            <div>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {isEditMode && (
                <p className="text-sm text-gray-500 mt-1">
                  Deja vacío para mantener la imagen actual
                </p>
              )}
            </div>
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
          <Button onClick={handleSubmit} disabled={loading || !isFormValid()}>
            {loading ? (
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
            ) : success ? (
              <CheckCircle className="text-green-500 w-4 h-4 mr-2" />
            ) : null}
            {success
              ? isEditMode ? 'Actualizado' : 'Creado'
              : loading
              ? isEditMode ? 'Guardando...' : 'Creando...'
              : isEditMode ? 'Guardar Cambios' : 'Crear Categoría'}
          </Button>
        </div>
      </DialogContent>
    </Dialog.Root>
  );
};

export default CategoryDialog;
