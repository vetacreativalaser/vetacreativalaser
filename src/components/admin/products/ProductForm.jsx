import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { validatePriceConfig } from '@/lib/priceUtils';
import { Save, X } from 'lucide-react';

import GeneralTab from './tabs/GeneralTab';
import PricingTab from './tabs/PricingTab';
import CustomizationTab from './tabs/CustomizationTab';
import ImagesTab from './tabs/ImagesTab';
import SeoRelTab from './tabs/SeoRelTab';

/**
 * ProductForm - Modal de creación/edición de productos
 *
 * Arquitectura según Protocolo v2.2:
 * - Modal con 5 Tabs (General, Pricing, Customization, Images, SeoRel)
 * - Mantiene estructura JSONB de price existente
 * - Soporte para purchase_mode (standard, contact_only, buy_and_clarify)
 * - react-easy-crop para imágenes
 * - Builder visual para custom_fields
 */
const ProductForm = ({ open, onOpenChange, product = null, onSaved }) => {
  const isEditing = !!product;
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);

  // Estado del formulario (consolidado)
  const [formData, setFormData] = useState({
    // General Tab
    name: '',
    sku: '',
    category_id: '',
    description: '',
    status: 'draft',
    is_featured: false,
    purchase_mode: 'standard',

    // Pricing Tab
    price: {
      type: 'fixed',
      value: 0
    },
    weight: null,
    length: null,
    width: null,
    height: null,

    // Customization Tab
    custom_fields: [],

    // Images Tab
    images: [],

    // SEO & Related Tab
    slug: '',
    seo_title: '',
    seo_description: '',
    related_products: []
  });

  // Cargar datos del producto si estamos editando
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category_id: product.category_id || '',
        description: product.description || product.full_description || '',
        status: product.status || 'draft',
        is_featured: product.is_featured || false,
        purchase_mode: product.purchase_mode || 'standard',

        price: product.price || { type: 'fixed', value: 0 },
        weight: product.weight || null,
        length: product.length || null,
        width: product.width || null,
        height: product.height || null,

        custom_fields: product.custom_fields || [],

        // Normalizar imágenes (de arrays separados a array unificado)
        images: normalizeImages(product),

        slug: product.slug || '',
        seo_title: product.seo_title || '',
        seo_description: product.seo_description || '',
        related_products: product.related_products || []
      });
    }
  }, [product]);

  // Normalizar imágenes desde el formato antiguo al nuevo
  const normalizeImages = (product) => {
    if (product.images && Array.isArray(product.images)) {
      // Formato nuevo (JSONB unificado)
      return product.images;
    }

    // Formato antiguo (arrays separados)
    const urls = product.image_urls || [];
    const alts = product.image_alts || [];
    const texts = product.image_texts || [];

    return urls.map((url, index) => ({
      id: `img-${index}`,
      url,
      alt: alts[index] || '',
      text: texts[index] || '',
      position: index
    }));
  };

  // Actualizar campo del formulario
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validar formulario antes de guardar
  const validateForm = () => {
    const errors = [];

    // General
    if (!formData.name.trim()) {
      errors.push('El nombre del producto es obligatorio');
    }
    if (!formData.category_id) {
      errors.push('Debes seleccionar una categoría');
    }

    // Pricing
    const priceValidation = validatePriceConfig(formData.price);
    if (!priceValidation.valid) {
      errors.push(...priceValidation.errors.map(e => `Precio: ${e}`));
    }

    // Purchase mode: si es contact_only, no requiere precio válido
    if (formData.purchase_mode === 'contact_only') {
      // Omitir validación de precio
      return { valid: errors.filter(e => !e.startsWith('Precio:')).length === 0, errors: errors.filter(e => !e.startsWith('Precio:')) };
    }

    return { valid: errors.length === 0, errors };
  };

  // Guardar producto (crear o actualizar)
  const handleSave = async () => {
    const validation = validateForm();

    if (!validation.valid) {
      toast({
        title: 'Errores de validación',
        description: validation.errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Generar SKU si no existe
      const sku = formData.sku || `SKU-${Date.now()}`;

      // Generar slug si no existe
      const slug = formData.slug || formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const productData = {
        name: formData.name,
        sku,
        category_id: formData.category_id,
        description: formData.description,
        status: formData.status,
        is_featured: formData.is_featured,
        purchase_mode: formData.purchase_mode,

        price: formData.price,
        weight: formData.weight,
        length: formData.length,
        width: formData.width,
        height: formData.height,

        custom_fields: formData.custom_fields,
        images: formData.images,

        slug,
        seo_title: formData.seo_title || formData.name,
        seo_description: formData.seo_description,
        related_products: formData.related_products
      };

      let result;

      if (isEditing) {
        // Actualizar producto existente
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .select()
          .single();
      } else {
        // Crear nuevo producto
        result = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
      }

      const { data, error } = result;

      if (error) throw error;

      toast({
        title: isEditing ? 'Producto actualizado' : 'Producto creado',
        description: `${formData.name} ha sido guardado correctamente`
      });

      // Resetear formulario y cerrar modal
      if (!isEditing) {
        setFormData({
          name: '',
          sku: '',
          category_id: '',
          description: '',
          status: 'draft',
          is_featured: false,
          purchase_mode: 'standard',
          price: { type: 'fixed', value: 0 },
          weight: null,
          length: null,
          width: null,
          height: null,
          custom_fields: [],
          images: [],
          slug: '',
          seo_title: '',
          seo_description: '',
          related_products: []
        });
      }

      onSaved?.(data);
      onOpenChange(false);

    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error al guardar',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="pricing">Precios</TabsTrigger>
            <TabsTrigger value="customization">Personalización</TabsTrigger>
            <TabsTrigger value="images">Imágenes</TabsTrigger>
            <TabsTrigger value="seo">SEO/Rel</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="general">
              <GeneralTab
                formData={formData}
                updateField={updateField}
              />
            </TabsContent>

            <TabsContent value="pricing">
              <PricingTab
                formData={formData}
                updateField={updateField}
              />
            </TabsContent>

            <TabsContent value="customization">
              <CustomizationTab
                formData={formData}
                updateField={updateField}
              />
            </TabsContent>

            <TabsContent value="images">
              <ImagesTab
                formData={formData}
                updateField={updateField}
              />
            </TabsContent>

            <TabsContent value="seo">
              <SeoRelTab
                formData={formData}
                updateField={updateField}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Botones de acción (fijos en el footer) */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-black text-white hover:bg-gray-800"
          >
            {isLoading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Actualizar' : 'Crear'} Producto
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
