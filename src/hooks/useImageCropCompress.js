import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { getCroppedImg } from '@/lib/cropImage';

/**
 * Hook personalizado para manejar crop y compresión de imágenes
 *
 * Encapsula el estado y lógica para:
 * - Seleccionar archivos
 * - Crop con coordenadas y zoom
 * - Comprimir imagen a WebP
 *
 * @param {Object} options - Opciones de compresión
 * @param {number} options.maxSizeMB - Tamaño máximo en MB (default: 0.2)
 * @param {number} options.maxWidthOrHeight - Dimensión máxima (default: 800)
 * @param {number} options.aspectRatio - Ratio de aspecto del crop (default: 1/1)
 * @returns {Object} Estado y funciones para crop/compress
 */
export function useImageCropCompress({
  maxSizeMB = 0.2,
  maxWidthOrHeight = 800,
  aspectRatio = 1 / 1
} = {}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  /**
   * Maneja la selección de archivo y lo convierte a data URL
   */
  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
  }, []);

  /**
   * Callback cuando se completa el crop
   */
  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  /**
   * Procesa la imagen: crop + compresión
   * @returns {Promise<Blob>} Blob de la imagen procesada en WebP
   */
  const processImage = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) {
      throw new Error('No hay imagen seleccionada o área de crop');
    }

    // 1. Crop
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

    // 2. Comprimir
    const compressed = await imageCompression(croppedBlob, {
      maxSizeMB,
      maxWidthOrHeight,
      fileType: 'image/webp',
    });

    return compressed;
  }, [imageSrc, croppedAreaPixels, maxSizeMB, maxWidthOrHeight]);

  /**
   * Resetea el estado del crop
   */
  const reset = useCallback(() => {
    setImageSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
  }, []);

  return {
    // Estado
    imageSrc,
    zoom,
    crop,
    croppedAreaPixels,
    aspectRatio,

    // Setters
    setZoom,
    setCrop,

    // Funciones
    handleFileSelect,
    onCropComplete,
    processImage,
    reset,
  };
}
