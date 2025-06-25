import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { PackagePlus, ImagePlus, Trash2, List, PlusCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CreateProduct = () => {
  const navigate = useNavigate();

  // Basic fields
  const [productName, setProductName] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Price type: 'fixed', 'byQuantity', 'byReason'
  const [priceType, setPriceType] = useState('fixed');
  const [fixedPrice, setFixedPrice] = useState('');
  const [quantityPrices, setQuantityPrices] = useState([{ quantity: '', price: '' }]);
  const [reasons, setReasons] = useState([{ reason: '', increment: '' }]);

  // Images & descriptions
  const [imageUrls, setImageUrls] = useState(['']);
  const [imageAlts, setImageAlts] = useState(['']);
  const [imageTexts, setImageTexts] = useState(['']);
  const [fullDescription, setFullDescription] = useState('');
  const [specifications, setSpecifications] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    supabase
      .from('categorias')
      .select('id, categoria')
      .then(({ data, error }) => {
        if (!error) setCategories(data);
      });
  }, []);

  // Handlers for dynamic lists
  const addQuantityRow = () => setQuantityPrices([...quantityPrices, { quantity: '', price: '' }]);
  const removeQuantityRow = idx => setQuantityPrices(quantityPrices.filter((_, i) => i !== idx));
  const updateQuantityRow = (idx, field, value) => {
    const arr = [...quantityPrices]; arr[idx][field] = value; setQuantityPrices(arr);
  };

  const addReason = () => setReasons([...reasons, { reason: '', increment: '' }]);
  const removeReason = idx => setReasons(reasons.filter((_, i) => i !== idx));
  const updateReason = (idx, field, value) => {
    const arr = [...reasons]; arr[idx][field] = value; setReasons(arr);
  };

  // Image & spec handlers
  const handleAddImageUrl = () => { setImageUrls([...imageUrls, '']); setImageAlts([...imageAlts, '']); setImageTexts([...imageTexts, '']); };
  const handleRemoveImageUrl = idx => { setImageUrls(imageUrls.filter((_, i) => i !== idx)); setImageAlts(imageAlts.filter((_, i) => i !== idx)); setImageTexts(imageTexts.filter((_, i) => i !== idx)); };
  const handleImageChange = (idx, field, value) => {
    const arr = field === 'url' ? [...imageUrls] : field === 'alt' ? [...imageAlts] : [...imageTexts];
    arr[idx] = value;
    field === 'url' ? setImageUrls(arr) : field === 'alt' ? setImageAlts(arr) : setImageTexts(arr);
  };

  const handleSpecificationChange = (idx, value) => {
    const arr = [...specifications]; arr[idx] = value; setSpecifications(arr);
  };
  const addSpecification = () => setSpecifications([...specifications, '']);
  const removeSpecification = idx => setSpecifications(specifications.filter((_, i) => i !== idx));

  const addBulletPoint = () => setFullDescription(prev => prev + "\n• ");

  // Submit
  const handleSubmit = async e => {
    e.preventDefault(); setIsLoading(true);

    const priceData = priceType === 'fixed'
      ? { type: 'fixed', value: fixedPrice }
      : priceType === 'byQuantity'
      ? { type: 'byQuantity', tiers: quantityPrices.filter(r => r.quantity && r.price) }
      : { type: 'byReason', base: fixedPrice, reasons: reasons.filter(r => r.reason && r.increment) };

    const productData = {
      name: productName,
      category_id: selectedCategory,
      price: priceData,
      image_urls: imageUrls.filter(url => url),
      image_alts: imageAlts.filter((_,i) => imageUrls[i]),
      image_texts: imageTexts.filter((_,i) => imageUrls[i]),
      full_description: fullDescription,
      specifications: specifications.filter(s => s),
    };

    const { error } = await supabase.from('products').insert([productData]);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Producto creado', description: productName });
      navigate('/admin/dashboard?tab=products');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gray-100">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto bg-white p-8 shadow border border-gray-200">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-black">Crear Nuevo Producto</h1>
          <Link to="/admin/dashboard"><Button variant="outline" className="border-gray-300 text-black hover:bg-gray-100"><ArrowLeft className="mr-2 h-4 w-4"/>Volver</Button></Link>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">

          <div><Label>Nombre del Producto</Label><Input value={productName} onChange={e => setProductName(e.target.value)} required disabled={isLoading}/></div>

          {/* Categoría */}
          <div><Label>Categoría</Label>
            <Select onValueChange={setSelectedCategory} value={selectedCategory}>
              <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Selecciona categoría"/></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Precio */}
          <div><Label>Tipo de Precio</Label>
            <Select onValueChange={setPriceType} value={priceType}>
              <SelectTrigger className="w-full mt-1"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Precio Fijo</SelectItem>
                <SelectItem value="byQuantity">Precio Variable según Cantidad</SelectItem>
                <SelectItem value="byReason">Precio Variable (Motivos)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos de Precio */}
          {priceType === 'fixed' && (
            <div><Label>Precio Fijo</Label><Input value={fixedPrice} onChange={e => setFixedPrice(e.target.value)} required disabled={isLoading}/></div>
          )}

          {priceType === 'byQuantity' && (
            <div className="space-y-2">
              <Label>Tabla de Precios por Cantidad</Label>
              {quantityPrices.map((r, i) => (
                <div key={i} className="flex space-x-2 items-center">
                  <Input placeholder="Cantidad min." value={r.quantity} onChange={e => updateQuantityRow(i, 'quantity', e.target.value)} disabled={isLoading}/>
                  <Input placeholder="Precio" value={r.price} onChange={e => updateQuantityRow(i, 'price', e.target.value)} disabled={isLoading}/>
                  {quantityPrices.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeQuantityRow(i)} disabled={isLoading}><Trash2/></Button>}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addQuantityRow} disabled={isLoading}><PlusCircle className="mr-2"/>Añadir fila</Button>
            </div>
          )}

          {priceType === 'byReason' && (
            <div className="space-y-2">
              <Label>Precio Base</Label><Input value={fixedPrice} onChange={e => setFixedPrice(e.target.value)} disabled={isLoading}/>
              <Label>Motivos de Incremento</Label>
              {reasons.map((r, i) => (
                <div key={i} className="flex space-x-2 items-center">
                  <Input placeholder="Motivo" value={r.reason} onChange={e => updateReason(i, 'reason', e.target.value)} disabled={isLoading}/>
                  <Input placeholder="Incremento" value={r.increment} onChange={e => updateReason(i, 'increment', e.target.value)} disabled={isLoading}/>
                  {reasons.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeReason(i)} disabled={isLoading}><Trash2/></Button>}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addReason} disabled={isLoading}><PlusCircle className="mr-2"/>Añadir motivo</Button>
            </div>
          )}

          {/* Resto de campos (imágenes, descripción, especificaciones) */}
          <div className="space-y-3">
            <Label>Imágenes (URLs)</Label>
            {imageUrls.map((url, idx) => (
              <div key={idx} className="space-y-2 p-3 border bg-gray-50">
                <div className="flex space-x-2">
                  <Input placeholder="URL" value={url} onChange={e => handleImageChange(idx, 'url', e.target.value)} disabled={isLoading}/>
                  {imageUrls.length>1 && <Button variant="ghost" size="icon" onClick={()=>handleRemoveImageUrl(idx)} disabled={isLoading}><Trash2/></Button>}
                </div>
                <Input placeholder="Alt" value={imageAlts[idx]} onChange={e=>handleImageChange(idx,'alt',e.target.value)} disabled={isLoading}/>
                <Input placeholder="Texto" value={imageTexts[idx]} onChange={e=>handleImageChange(idx,'text',e.target.value)} disabled={isLoading}/>
              </div>
            ))}
            <Button variant="outline" onClick={handleAddImageUrl} disabled={isLoading}><ImagePlus className="mr-2"/>Añadir URL</Button>
          </div>

          <div>
            <Label>Descripción Completa</Label>
            <Textarea rows={6} value={fullDescription} onChange={e=>setFullDescription(e.target.value)} disabled={isLoading}/>
            <Button type="button" variant="outline" size="sm" onClick={addBulletPoint} disabled={isLoading}><List className="mr-1"/>Viñeta</Button>
          </div>

          <div className="space-y-2">
            <Label>Especificaciones</Label>
            {specifications.map((s,i)=>(
              <div key={i} className="flex space-x-2 items-center">
                <Input value={s} onChange={e=>handleSpecificationChange(i,e.target.value)} disabled={isLoading}/>                
                {specifications.length>1 && <Button variant="ghost" size="icon" onClick={()=>removeSpecification(i)} disabled={isLoading}><Trash2/></Button>}
              </div>
            ))}
            <Button variant="outline" onClick={addSpecification} disabled={isLoading}><PlusCircle className="mr-2"/>Añadir</Button>
          </div>

          <Button type="submit" size="lg" className="w-full bg-black text-white py-3" disabled={isLoading}>
            {isLoading? <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full mr-2"></div> : <PackagePlus className="mr-2 h-5 w-5"/>}
            {isLoading? 'Creando...' : 'Crear Producto'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateProduct;
