export const getCroppedImg = (imageSrc, crop, rotation = 0) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const rotRad = (rotation * Math.PI) / 180;

      // Calcular dimensiones del canvas rotado
      const bBoxWidth = Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height);
      const bBoxHeight = Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height);

      // Configurar canvas con tamaño suficiente para la imagen rotada
      canvas.width = bBoxWidth;
      canvas.height = bBoxHeight;

      // Configurar transformación para rotar desde el centro
      ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
      ctx.rotate(rotRad);
      ctx.translate(-image.width / 2, -image.height / 2);

      // Dibujar imagen rotada
      ctx.drawImage(image, 0, 0);

      // Resetear transformación
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Extraer el área recortada
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');

      croppedCanvas.width = crop.width;
      croppedCanvas.height = crop.height;

      // Copiar el área recortada desde el canvas rotado
      croppedCtx.drawImage(
        canvas,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      croppedCanvas.toBlob((blob) => {
        if (!blob) return reject(new Error('No se pudo recortar'));
        resolve(blob);
      }, 'image/webp');
    };
    image.onerror = reject;
  });
};
