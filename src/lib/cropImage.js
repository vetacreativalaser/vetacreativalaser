export const getCroppedImg = (imageSrc, crop, rotation = 0) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const maxSize = Math.max(image.width, image.height);
      const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

      // Configurar canvas temporal para rotación
      canvas.width = safeArea;
      canvas.height = safeArea;

      // Trasladar al centro
      ctx.translate(safeArea / 2, safeArea / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-safeArea / 2, -safeArea / 2);

      // Dibujar imagen rotada
      ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
      );

      const data = ctx.getImageData(0, 0, safeArea, safeArea);

      // Configurar canvas final con el tamaño del crop
      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - crop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - crop.y)
      );

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('No se pudo recortar'));
        resolve(blob);
      }, 'image/webp');
    };
    image.onerror = reject;
  });
};
