import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { getCroppedImg } from '@/lib/cropImage';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, PlusCircle, Trash2, PackagePlus } from 'lucide-react';

const CreateProduct = () => {
  const navigate = useNavigate();

  const [productName, setProductName] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceType, setPriceType] = useState('fixed');
  const [fixedPrice, setFixedPrice] = useState('');
  const [quantityPrices, setQuantityPrices] = useState([{ quantity: '', price: '' }]);
  const [reasons, setReasons] = useState([{ reason: '', increment: '' }]);
  const [images, setImages] = useState([]);
  const [fullDescription, setFullDescription] = useState('');
  const [specifications, setSpecifications] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase
      .from('categorias')
      .select('id, categoria')
      .then(({ data, error }) => {
        if (!error) setCategories(data);
      });
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImages((prev) => [...prev, { src: reader.result, alt: '', text: '', crop: { x: 0, y: 0 }, zoom: 1, croppedAreaPixels: null }]);
    };
    reader.readAsDataURL(file);
  };

  const updateImage = (idx, field, value) => {
    const newImages = [...images];
    newImages[idx][field] = value;
    setImages(newImages);
  };

  const removeImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleCropComplete = (idx, _, croppedPixels) => {
    updateImage(idx, 'croppedAreaPixels', croppedPixels);
  };

  const addQuantityRow = () => setQuantityPrices([...quantityPrices, { quantity: '', price: '' }]);
  const addReasonRow = () => setReasons([...reasons, { reason: '', increment: '' }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const uploadedUrls = [];
      const alts = [];
      const texts = [];

      for (let i = 0; i < images.length; i++) {
        const { src, croppedAreaPixels, alt, text } = images[i];
        const croppedBlob = await getCroppedImg(src, croppedAreaPixels);
        const compressed = await imageCompression(croppedBlob, {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 1000,
          fileType: 'image/webp',
        });

        const fileName = `producto-${Date.now()}-${i}.webp`;
        const { error: uploadError } = await supabase.storage.from('productos').upload(fileName, compressed, { contentType: 'image/webp' });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('productos').getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
        alts.push(alt);
        texts.push(text);
      }

      const priceData = priceType === 'fixed'
        ? { type: 'fixed', value: fixedPrice }
        : priceType === 'byQuantity'
        ? { type: 'byQuantity', tiers: quantityPrices.filter(r => r.quantity && r.price) }
        : { type: 'byReason', base: fixedPrice, reasons: reasons.filter(r => r.reason && r.increment) };

      const { error } = await supabase.from('products').insert([{
        name: productName,
        category_id: selectedCategory,
        price: priceData,
        image_urls: uploadedUrls,
        image_alts: alts,
        image_texts: texts,
        full_description: fullDescription,
        specifications: specifications.filter(Boolean),
      }]);

      if (error) throw error;
      toast({ title: 'Producto creado', description: productName });
      navigate('/admin/dashboard?tab=products');
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gray-100">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto bg-white p-8 shadow border border-gray-200">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-black">Crear Nuevo Producto</h1>
          <Link to="/admin/dashboard">
            <Button variant="outline" className="border-gray-300 text-black hover:bg-gray-100">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Nombre del Producto</Label>
            <Input value={productName} onChange={e => setProductName(e.target.value)} required disabled={isLoading} />
          </div>

          <div>
            <Label>Categoría</Label>
            <Select onValueChange={setSelectedCategory} value={selectedCategory}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.categoria}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tipo de Precio</Label>
            <Select onValueChange={setPriceType} value={priceType}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Precio Fijo</SelectItem>
                <SelectItem value="byQuantity">Precio por Cantidad</SelectItem>
                <SelectItem value="byReason">Precio con Motivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {priceType === 'fixed' && (
            <div>
              <Label>Precio Fijo</Label>
              <Input value={fixedPrice} onChange={e => setFixedPrice(e.target.value)} required disabled={isLoading} />
            </div>
          )}

          {priceType === 'byQuantity' && (
            <div className="space-y-2">
              <Label>Precios por Cantidad (precio por unidad)</Label>
              {quantityPrices.map((r, i) => (
                <div key={i} className="flex space-x-2 items-center">
                  <Input placeholder="Cantidad mínima" value={r.quantity} onChange={e => {
                    const newRows = [...quantityPrices];
                    newRows[i].quantity = e.target.value;
                    setQuantityPrices(newRows);
                  }} />
                  <Input placeholder="Precio por unidad" value={r.price} onChange={e => {
                    const newRows = [...quantityPrices];
                    newRows[i].price = e.target.value;
                    setQuantityPrices(newRows);
                  }} />
                  <Button type="button" variant="ghost" onClick={() => setQuantityPrices(quantityPrices.filter((_, idx) => idx !== i))}><Trash2 /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addQuantityRow}><PlusCircle className="mr-2" />Añadir fila</Button>
            </div>
          )}

          {priceType === 'byReason' && (
            <div className="space-y-2">
              <Label>Precio Base</Label>
              <Input value={fixedPrice} onChange={e => setFixedPrice(e.target.value)} />
              <Label>Motivos de Incremento</Label>
              {reasons.map((r, i) => (
                <div key={i} className="flex space-x-2 items-center">
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
              <Button type="button" variant="outline" onClick={addReasonRow}><PlusCircle className="mr-2" />Añadir motivo</Button>
            </div>
          )}

          {/* Imágenes */}
          <div className="space-y-4">
            <Label>Imágenes del Producto</Label>
            {images.map((img, i) => (
              <div key={i} className="border p-2 bg-gray-50">
                <div className="relative w-full h-60">
                  <Cropper
                    image={img.src}
                    crop={img.crop}
                    zoom={img.zoom}
                    aspect={1 / 1}
                    onCropChange={(val) => updateImage(i, 'crop', val)}
                    onCropComplete={(c, p) => handleCropComplete(i, c, p)}
                    onZoomChange={(val) => updateImage(i, 'zoom', val)}
                  />
                </div>
                <Input placeholder="Alt" value={img.alt} onChange={e => updateImage(i, 'alt', e.target.value)} className="mt-2" />
                <Input placeholder="Texto" value={img.text} onChange={e => updateImage(i, 'text', e.target.value)} className="mt-2" />
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => removeImage(i)}><Trash2 className="mr-1 w-4 h-4" />Eliminar</Button>
              </div>
            ))}
            <Input type="file" accept="image/*" onChange={handleImageChange} />
          </div>

          <div>
            <Label>Descripción Completa</Label>
            <Textarea rows={5} value={fullDescription} onChange={e => setFullDescription(e.target.value)} disabled={isLoading} />
          </div>

          <div className="space-y-2">
            <Label>Especificaciones</Label>
            {specifications.map((s, i) => (
              <div key={i} className="flex space-x-2">
                <Input value={s} onChange={e => {
                  const newSpecs = [...specifications];
                  newSpecs[i] = e.target.value;
                  setSpecifications(newSpecs);
                }} />
                <Button variant="ghost" size="icon" onClick={() => removeImage(i)}><Trash2 /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setSpecifications([...specifications, ''])}><PlusCircle className="mr-2" />Añadir</Button>
          </div>

          <Button type="submit" className="w-full bg-black text-white py-3" disabled={isLoading}>
            {isLoading ? <span className="animate-spin h-5 w-5 border-b-2 border-white rounded-full mr-2"></span> : <PackagePlus className="mr-2 h-5 w-5" />}
            {isLoading ? 'Creando...' : 'Crear Producto'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateProduct;
