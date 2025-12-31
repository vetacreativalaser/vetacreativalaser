import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { getCroppedImg } from '@/lib/cropImage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { Trash2 } from 'lucide-react';

const safeDecode = (str) => {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

const safeParse = (input) => {
  try {
    const parsed = typeof input === 'string' ? JSON.parse(input) : input;
    return Array.isArray(parsed) ? parsed.map(safeDecode) : [];
  } catch {
    return [];
  }
};

const EditProductDialog = ({ open, onOpenChange, product, onUpdated }) => {
  const [images, setImages] = useState([]);
  const [name, setName] = useState(product.name || '');
  const [description, setDescription] = useState(product.full_description || '');
  const [priceType, setPriceType] = useState(product.price?.type || 'fixed');
  const [fixedPrice, setFixedPrice] = useState(product.price?.value || product.price?.base || '');
  const [quantityPrices, setQuantityPrices] = useState(product.price?.tiers || [{ quantity: '', price: '' }]);
  const [reasons, setReasons] = useState(product.price?.reasons || [{ reason: '', increment: '' }]);
  const [specifications, setSpecifications] = useState(product.specifications || ['']);
  const [selectedCategory, setSelectedCategory] = useState(product.category_id || '');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const alts = safeParse(product.image_alts);
    const texts = safeParse(product.image_texts);
    const parsedImages = (product.image_urls || []).map((url, i) => ({
      src: url,
      alt: alts[i] || '',
      text: texts[i] || '',
      crop: { x: 0, y: 0 },
      zoom: 1,
      croppedAreaPixels: null,
      existing: true
    }));
    setImages(parsedImages);
  }, [product]);

  useEffect(() => {
    supabase.from('categorias').select('id, categoria').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const updateImage = (idx, field, value) => {
    const updated = [...images];
    updated[idx][field] = value;
    setImages(updated);
  };

  const handleCropComplete = (idx, _, croppedPixels) => {
    updateImage(idx, 'croppedAreaPixels', croppedPixels);
  };

  const removeImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleImageAdd = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImages([...images, {
        src: reader.result,
        alt: '',
        text: '',
        crop: { x: 0, y: 0 },
        zoom: 1,
        croppedAreaPixels: null,
        existing: false
      }]);
    };
    reader.readAsDataURL(file);
  };

  const addQuantityRow = () => setQuantityPrices([...quantityPrices, { quantity: '', price: '' }]);
  const addReasonRow = () => setReasons([...reasons, { reason: '', increment: '' }]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const newUrls = [];
      const alts = [];
      const texts = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.existing) {
          newUrls.push(img.src);
          alts.push(img.alt);
          texts.push(img.text);
        } else {
          const croppedBlob = await getCroppedImg(img.src, img.croppedAreaPixels);
          const compressed = await imageCompression(croppedBlob, {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 1000,
            fileType: 'image/webp'
          });
          const filename = `producto-${Date.now()}-${i}.webp`;
          const { error } = await supabase.storage.from('productos').upload(filename, compressed, {
            contentType: 'image/webp'
          });
          if (error) throw error;
          const { data } = supabase.storage.from('productos').getPublicUrl(filename);
          newUrls.push(data.publicUrl);
          alts.push(img.alt);
          texts.push(img.text);
        }
      }

      const price = priceType === 'fixed'
        ? { type: 'fixed', value: fixedPrice }
        : priceType === 'byQuantity'
        ? { type: 'byQuantity', tiers: quantityPrices }
        : { type: 'byReason', base: fixedPrice, reasons };

      const { error } = await supabase.from('products').update({
        name,
        full_description: description,
        image_urls: newUrls,
        image_alts: alts,
        image_texts: texts,
        specifications,
        price,
        category_id: selectedCategory
      }).eq('id', product.id);

      if (error) throw error;
      onUpdated();
      onOpenChange(false);
    } catch (err) {
      console.error("❌ Error actualizando producto:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 bg-white rounded-lg p-6 w-full max-w-3xl transform -translate-x-1/2 -translate-y-1/2 z-50 overflow-y-auto max-h-[90vh]">
          <h2 className="text-xl font-bold mb-4">Editar Producto</h2>

          <Label>Nombre</Label>
          <Input value={name} onChange={e => setName(e.target.value)} className="mb-4" />

          <Label>Descripción</Label>
          <Textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} className="mb-4" />

          <Label>Categoría</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full mt-1 mb-4">
              <SelectValue placeholder="Selecciona categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.categoria}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label>Tipo de Precio</Label>
          <Select value={priceType} onValueChange={setPriceType}>
            <SelectTrigger className="w-full mt-1 mb-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Precio Fijo</SelectItem>
              <SelectItem value="byQuantity">Precio por Cantidad</SelectItem>
              <SelectItem value="byReason">Precio con Motivos</SelectItem>
            </SelectContent>
          </Select>

          {priceType === 'fixed' && (
            <div className="mb-4">
              <Label>Precio Fijo</Label>
              <Input value={fixedPrice} onChange={e => setFixedPrice(e.target.value)} />
            </div>
          )}

          {priceType === 'byQuantity' && (
            <div className="space-y-2 mb-4">
              <Label>Precios por Cantidad</Label>
              {quantityPrices.map((row, i) => (
                <div key={i} className="flex space-x-2">
                  <Input placeholder="Cantidad mínima" value={row.quantity} onChange={e => {
                    const updated = [...quantityPrices];
                    updated[i].quantity = e.target.value;
                    setQuantityPrices(updated);
                  }} />
                  <Input placeholder="Precio por unidad" value={row.price} onChange={e => {
                    const updated = [...quantityPrices];
                    updated[i].price = e.target.value;
                    setQuantityPrices(updated);
                  }} />
                  <Button type="button" variant="ghost" onClick={() => setQuantityPrices(quantityPrices.filter((_, idx) => idx !== i))}><Trash2 /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addQuantityRow}>Añadir fila</Button>
            </div>
          )}

          {priceType === 'byReason' && (
            <div className="space-y-2 mb-4">
              <Label>Precio Base</Label>
              <Input value={fixedPrice} onChange={e => setFixedPrice(e.target.value)} />
              <Label>Motivos</Label>
              {reasons.map((r, i) => (
                <div key={i} className="flex space-x-2">
                  <Input placeholder="Motivo" value={r.reason} onChange={e => {
                    const updated = [...reasons];
                    updated[i].reason = e.target.value;
                    setReasons(updated);
                  }} />
                  <Input placeholder="Incremento (€)" value={r.increment} onChange={e => {
                    const updated = [...reasons];
                    updated[i].increment = e.target.value;
                    setReasons(updated);
                  }} />
                  <Button type="button" variant="ghost" onClick={() => setReasons(reasons.filter((_, idx) => idx !== i))}><Trash2 /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addReasonRow}>Añadir motivo</Button>
            </div>
          )}

          <Label>Especificaciones</Label>
          {specifications.map((spec, i) => (
            <div key={i} className="flex space-x-2 mb-2">
              <Input value={spec} onChange={e => {
                const updated = [...specifications];
                updated[i] = e.target.value;
                setSpecifications(updated);
              }} />
              <Button type="button" variant="ghost" size="icon" onClick={() => setSpecifications(specifications.filter((_, idx) => idx !== i))}><Trash2 /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setSpecifications([...specifications, ''])}>Añadir especificación</Button>

          <div className="mt-6">
            <Label>Imágenes</Label>
            <div className="space-y-4">
              {images.map((img, i) => (
                <div key={i} className="bg-gray-100 border p-2">
                  <div className="relative w-full h-48">
                    {!img.existing ? (
                      <Cropper
                        image={img.src}
                        crop={img.crop}
                        zoom={img.zoom}
                        aspect={1 / 1}
                        onCropChange={(val) => updateImage(i, 'crop', val)}
                        onCropComplete={(c, p) => handleCropComplete(i, c, p)}
                        onZoomChange={(val) => updateImage(i, 'zoom', val)}
                      />
                    ) : (
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <Input placeholder="Alt" value={img.alt} onChange={e => updateImage(i, 'alt', e.target.value)} className="mt-2" />
                  <Input placeholder="Texto" value={img.text} onChange={e => updateImage(i, 'text', e.target.value)} className="mt-2" />
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => removeImage(i)}><Trash2 className="mr-1 w-4 h-4" />Eliminar</Button>
                </div>
              ))}
              <Input type="file" accept="image/*" onChange={handleImageAdd} />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>    </Dialog.Root>
  );
};

export default EditProductDialog;
