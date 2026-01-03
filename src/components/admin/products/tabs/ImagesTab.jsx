import { useState } from 'react';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { getCroppedImg } from '@/lib/cropImage';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { extractImagePath } from '@/lib/imageUtils';
import {
  Upload,
  X,
  Image as ImageIcon,
  Star,
  ChevronUp,
  ChevronDown,
  Crop
} from 'lucide-react';

/**
 * ImagesTab - Gestión de imágenes con crop
 *
 * Flujo:
 * 1. Usuario selecciona imagen
 * 2. Se abre modal con react-easy-crop
 * 3. Usuario recorta y confirma
 * 4. Se sube a Supabase Storage (bucket 'productos')
 * 5. Se añade al array images con estructura unificada JSONB
 *
 * Funciones:
 * - Reordenar imágenes
 * - Definir imagen principal (position: 0)
 * - Editar alt/text
 * - Eliminar imágenes
 */
const ImagesTab = ({ formData, updateField }) => {
  // Estado para el crop modal
  const [cropModal, setCropModal] = useState({
    open: false,
    imageSrc: null,
    fileName: null
  });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Seleccionar archivo
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Archivo inválido',
        description: 'Solo se permiten archivos de imagen',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropModal({
        open: true,
        imageSrc: reader.result,
        fileName: file.name
      });
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    };
    reader.readAsDataURL(file);

    // Reset input para permitir seleccionar el mismo archivo
    e.target.value = '';
  };

  // Callback cuando se completa el crop
  const onCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  // Confirmar crop y subir a Supabase
  const handleConfirmCrop = async () => {
    if (!croppedAreaPixels || !cropModal.imageSrc) return;

    setUploading(true);

    try {
      // 1. Recortar imagen
      const croppedBlob = await getCroppedImg(cropModal.imageSrc, croppedAreaPixels);

      // 2. Comprimir a WebP
      const compressedFile = await imageCompression(croppedBlob, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1200,
        fileType: 'image/webp'
      });

      // 3. Subir a Supabase Storage
      const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(fileName, compressedFile, {
          contentType: 'image/webp',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // 4. Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('productos')
        .getPublicUrl(fileName);

      // 5. Añadir al array de imágenes
      const newImage = {
        id: `img-${Date.now()}`,
        url: urlData.publicUrl,
        alt: '',
        text: '',
        position: formData.images.length
      };

      updateField('images', [...formData.images, newImage]);

      toast({
        title: 'Imagen subida',
        description: 'La imagen se ha procesado y guardado correctamente'
      });

      // Cerrar modal
      setCropModal({ open: false, imageSrc: null, fileName: null });

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error al subir imagen',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  // Actualizar alt/text de imagen
  const updateImageMeta = (imageId, field, value) => {
    const updatedImages = formData.images.map(img =>
      img.id === imageId ? { ...img, [field]: value } : img
    );
    updateField('images', updatedImages);
  };

  // Eliminar imagen
  const removeImage = async (imageId) => {
    const imageToRemove = formData.images.find(img => img.id === imageId);

    // Borrar del storage si existe una URL
    if (imageToRemove?.url) {
      const path = extractImagePath(imageToRemove.url, 'productos');

      if (path) {
        const { error } = await supabase.storage
          .from('productos')
          .remove([path]);

        if (error) {
          console.error('Error al eliminar imagen del storage:', error);
        }
      }
    }

    // Actualizar el estado
    const updatedImages = formData.images
      .filter(img => img.id !== imageId)
      .map((img, index) => ({ ...img, position: index }));
    updateField('images', updatedImages);
  };

  // Mover imagen arriba
  const moveImageUp = (index) => {
    if (index === 0) return;
    const images = [...formData.images];
    [images[index - 1], images[index]] = [images[index], images[index - 1]];
    // Actualizar positions
    const updatedImages = images.map((img, i) => ({ ...img, position: i }));
    updateField('images', updatedImages);
  };

  // Mover imagen abajo
  const moveImageDown = (index) => {
    if (index === formData.images.length - 1) return;
    const images = [...formData.images];
    [images[index], images[index + 1]] = [images[index + 1], images[index]];
    // Actualizar positions
    const updatedImages = images.map((img, i) => ({ ...img, position: i }));
    updateField('images', updatedImages);
  };

  // Definir como imagen principal
  const setAsPrimary = (index) => {
    const images = [...formData.images];
    const [primaryImage] = images.splice(index, 1);
    images.unshift(primaryImage);
    // Actualizar positions
    const updatedImages = images.map((img, i) => ({ ...img, position: i }));
    updateField('images', updatedImages);
  };

  return (
    <div className="space-y-6">
      {/* Header con botón de subida */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Galería de Imágenes del Producto
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            La primera imagen será la principal. Puedes reordenarlas arrastrando o con las flechas.
          </p>
        </div>
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <Label htmlFor="image-upload" className="cursor-pointer">
            <Button type="button" asChild className="bg-black text-white hover:bg-gray-800">
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Subir Imagen
              </span>
            </Button>
          </Label>
        </div>
      </div>

      {/* Lista de imágenes */}
      {formData.images && formData.images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formData.images.map((image, index) => (
            <div
              key={image.id}
              className="border border-gray-200 rounded-lg bg-white overflow-hidden"
            >
              {/* Imagen preview */}
              <div className="relative aspect-square bg-gray-100">
                <img
                  src={image.url}
                  alt={image.alt || 'Producto'}
                  className="w-full h-full object-cover"
                />
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Principal
                  </div>
                )}
              </div>

              {/* Controles */}
              <div className="p-3 space-y-3">
                {/* Alt text */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Texto alternativo (Alt)</Label>
                  <Input
                    placeholder="Descripción para accesibilidad"
                    value={image.alt}
                    onChange={(e) => updateImageMeta(image.id, 'alt', e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Image text */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Texto descriptivo</Label>
                  <Input
                    placeholder="Descripción visible"
                    value={image.text}
                    onChange={(e) => updateImageMeta(image.id, 'text', e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-2">
                  {index !== 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setAsPrimary(index)}
                      className="flex-1"
                    >
                      <Star className="mr-1 h-3 w-3" />
                      Hacer principal
                    </Button>
                  )}
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => moveImageUp(index)}
                      disabled={index === 0}
                      className="h-8 w-8"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => moveImageDown(index)}
                      disabled={index === formData.images.length - 1}
                      className="h-8 w-8"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => removeImage(image.id)}
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            Sin imágenes
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Sube al menos una imagen para mostrar el producto
          </p>
          <Label htmlFor="image-upload" className="cursor-pointer">
            <Button type="button" asChild variant="outline">
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Subir primera imagen
              </span>
            </Button>
          </Label>
        </div>
      )}

      {/* Modal de Crop */}
      <Dialog open={cropModal.open} onOpenChange={(open) => !uploading && setCropModal({ ...cropModal, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="h-5 w-5" />
              Recortar Imagen
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Área de crop */}
            <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
              {cropModal.imageSrc && (
                <Cropper
                  image={cropModal.imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </div>

            {/* Control de zoom */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Zoom</Label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Información */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800">
                Ajusta el área de recorte arrastrando la imagen o usando el zoom.
                La imagen se guardará en formato cuadrado (1:1) y se comprimirá automáticamente.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCropModal({ open: false, imageSrc: null, fileName: null })}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCrop}
              disabled={uploading || !croppedAreaPixels}
              className="bg-black text-white hover:bg-gray-800"
            >
              {uploading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Confirmar y Subir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImagesTab;
