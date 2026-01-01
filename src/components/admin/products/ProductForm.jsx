import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
// Validación de precios ahora se hace inline en validateForm
import { Save, X, AlertCircle } from 'lucide-react';

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
const LOCALSTORAGE_KEY = 'unsaved_product_form';

const ProductForm = ({ open, onOpenChange, product = null, onSaved }) => {
  const isEditing = !!product;
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const isInitialMount = useRef(true);

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

    // Shipping
    shipping_length: null,
    shipping_width: null,
    shipping_height: null,
    shipping_weight: null,
    stripe_product_id: null,
    stripe_price_id: null,

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

  // Cargar datos del producto si estamos editando, o restaurar borrador
  useEffect(() => {
    if (product) {
      // Modo edición: cargar datos del producto
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category_id: product.category_id ? String(product.category_id) : '',
        description: product.description || product.full_description || '',
        status: product.status || 'draft',
        is_featured: product.is_featured || false,
        purchase_mode: product.purchase_mode || 'standard',

        price: product.price || { type: 'fixed', value: 0 },

        shipping_length: product.shipping_length || null,
        shipping_width: product.shipping_width || null,
        shipping_height: product.shipping_height || null,
        shipping_weight: product.shipping_weight || null,
        stripe_product_id: product.stripe_product_id || null,
        stripe_price_id: product.stripe_price_id || null,

        custom_fields: product.custom_fields || [],

        // Normalizar imágenes (de arrays separados a array unificado)
        images: normalizeImages(product),

        slug: product.slug || '',
        seo_title: product.seo_title || '',
        seo_description: product.seo_description || '',
        related_products: product.related_products || []
      });
      isInitialMount.current = false;
    } else if (open && isInitialMount.current) {
      // Modo creación: comprobar si hay borrador guardado
      const savedDraft = localStorage.getItem(LOCALSTORAGE_KEY);
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          const shouldRestore = window.confirm(
            '¿Deseas restaurar el borrador guardado automáticamente?\n\nSi aceptas, se recuperarán los datos que no guardaste la última vez.'
          );

          if (shouldRestore) {
            setFormData(draftData);
            toast({
              title: 'Borrador restaurado',
              description: 'Se han recuperado los datos guardados automáticamente'
            });
          } else {
            localStorage.removeItem(LOCALSTORAGE_KEY);
          }
        } catch (error) {
          console.error('Error parsing draft:', error);
          localStorage.removeItem(LOCALSTORAGE_KEY);
        }
      }
      isInitialMount.current = false;
    }
  }, [product, open]);

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

  // Auto-guardar en localStorage (solo en modo creación)
  useEffect(() => {
    if (!isEditing && !isInitialMount.current && formData.name.trim()) {
      // Debounce: guardar después de 1 segundo de inactividad
      const timeoutId = setTimeout(() => {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(formData));
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [formData, isEditing]);

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

    // Purchase mode: si es contact_only, no requiere precio válido
    if (formData.purchase_mode === 'contact_only') {
      return { valid: errors.length === 0, errors };
    }

    // Pricing - Solo validar según el tipo seleccionado
    const priceType = formData.price?.type;

    if (!priceType) {
      errors.push('Precio: Debes seleccionar un tipo de precio');
    } else if (priceType === 'fixed') {
      // Validar solo precio fijo
      const value = parseFloat(formData.price.value);
      if (isNaN(value) || value < 0) {
        errors.push('Precio: El precio fijo debe ser un número válido mayor o igual a 0');
      }
    } else if (priceType === 'byQuantity') {
      // Validar solo tiers
      if (!formData.price.tiers || formData.price.tiers.length === 0) {
        errors.push('Precio: Debes añadir al menos un rango de cantidad');
      } else {
        formData.price.tiers.forEach((tier, index) => {
          const min = parseInt(tier.min);
          const price = parseFloat(tier.price);

          if (isNaN(min) || min < 1) {
            errors.push(`Precio: Rango ${index + 1} - La cantidad mínima debe ser al menos 1`);
          }
          if (isNaN(price) || price < 0) {
            errors.push(`Precio: Rango ${index + 1} - El precio debe ser válido y mayor o igual a 0`);
          }
        });
      }
    } else if (priceType === 'byReason') {
      // Validar base + reasons
      const base = parseFloat(formData.price.base);
      if (isNaN(base) || base < 0) {
        errors.push('Precio: El precio base debe ser un número válido mayor o igual a 0');
      }

      if (!formData.price.reasons || formData.price.reasons.length === 0) {
        errors.push('Precio: Debes añadir al menos un motivo');
      } else {
        formData.price.reasons.forEach((reason, index) => {
          if (!reason.reason || !reason.reason.trim()) {
            errors.push(`Precio: Motivo ${index + 1} - Debes especificar el nombre del motivo`);
          }
          const increment = parseFloat(reason.increment);
          if (isNaN(increment)) {
            errors.push(`Precio: Motivo ${index + 1} - El incremento debe ser un número válido`);
          }
        });
      }
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

      // Sincronizar con Stripe si es necesario
      let stripeProductId = formData.stripe_product_id;
      let stripePriceId = formData.stripe_price_id;

      // Normalizar el objeto price (convertir strings a números)
      const normalizedPrice = { ...formData.price };
      if (normalizedPrice.type === 'fixed' && normalizedPrice.value) {
        normalizedPrice.value = parseFloat(normalizedPrice.value);
      } else if (normalizedPrice.type === 'byQuantity' && normalizedPrice.tiers) {
        normalizedPrice.tiers = normalizedPrice.tiers.map(tier => ({
          ...tier,
          price: parseFloat(tier.price) || 0,
        }));
      } else if (normalizedPrice.type === 'byReason') {
        normalizedPrice.base = parseFloat(normalizedPrice.base) || 0;
        if (normalizedPrice.reasons) {
          normalizedPrice.reasons = normalizedPrice.reasons.map(reason => ({
            ...reason,
            increment: parseFloat(reason.increment) || 0,
          }));
        }
      }

      // Preparar el record completo para Stripe
      const stripeRecord = {
        id: product?.id,
        name: formData.name,
        full_description: formData.description,
        price: normalizedPrice,
        images: formData.images,
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
        sku,
        slug,
        purchase_mode: formData.purchase_mode,
      };

      console.log('🔍 Enviando a Stripe Edge Function:', {
        purchase_mode: stripeRecord.purchase_mode,
        price_type: stripeRecord.price?.type,
        price_value: stripeRecord.price?.value,
        stripe_product_id: stripeRecord.stripe_product_id,
      });

      try {
        // Llamar a la Edge Function con el record completo
        const { data: functionData, error: functionError } = await supabase.functions.invoke('sync-stripe-product', {
          body: {
            record: stripeRecord,
          },
        });

        console.log('📥 Respuesta de Stripe Edge Function:', functionData);

        // DEBUG: Mostrar respuesta completa antes de que recargue
        if (functionData) {
          console.table({
            'Success': functionData.success,
            'Message': functionData.message,
            'Reactivated': functionData.reactivated,
            'Archived': functionData.archived,
            'Skipped': functionData.skipped,
            'Stripe Product ID': functionData.stripe_product_id,
            'Stripe Price ID': functionData.stripe_price_id,
          });
        }

        if (functionError) {
          console.error('Error al sincronizar con Stripe:', functionError);
          toast({
            title: 'Advertencia: Stripe',
            description: 'No se pudo sincronizar con Stripe, pero se guardará en la base de datos.',
            variant: 'warning',
          });
        } else if (functionData?.stripe_product_id) {
          stripeProductId = functionData.stripe_product_id;
          stripePriceId = functionData.stripe_price_id;

          if (functionData.archived) {
            toast({
              title: 'Producto archivado en Stripe',
              description: 'El producto se ha archivado porque la compra online está deshabilitada.',
            });
          } else if (functionData.skipped) {
            const isVariablePricing = functionData.reason === 'variable_pricing';
            toast({
              title: 'Stripe: Sincronización omitida',
              description: isVariablePricing
                ? 'Los productos con precio variable (por cantidad/motivo) no se sincronizan con Stripe.'
                : 'El producto no se sincronizó porque la compra online está deshabilitada.',
              variant: isVariablePricing ? 'default' : 'default',
            });
          } else if (functionData.reactivated) {
            toast({
              title: '✅ Producto reactivado en Stripe',
              description: 'El producto archivado ha sido reactivado para compra online.',
            });
          } else {
            toast({
              title: 'Sincronizado con Stripe',
              description: functionData.price_updated
                ? 'Producto y precio actualizados en Stripe.'
                : 'Producto sincronizado con Stripe.',
            });
          }
        }
      } catch (stripeError) {
        console.error('Error inesperado al sincronizar con Stripe:', stripeError);
        // No bloqueamos el guardado, solo advertimos
      }

      const productData = {
        name: formData.name,
        sku,
        category_id: formData.category_id,
        full_description: formData.description, // Mapear a full_description para la BD
        status: formData.status,
        is_featured: formData.is_featured,
        purchase_mode: formData.purchase_mode,

        price: formData.price,

        shipping_length: formData.shipping_length ? parseFloat(formData.shipping_length) : null,
        shipping_width: formData.shipping_width ? parseFloat(formData.shipping_width) : null,
        shipping_height: formData.shipping_height ? parseFloat(formData.shipping_height) : null,
        shipping_weight: formData.shipping_weight ? parseFloat(formData.shipping_weight) : null,
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,

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

      // Limpiar localStorage al guardar exitosamente
      localStorage.removeItem(LOCALSTORAGE_KEY);

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
          shipping_length: null,
          shipping_width: null,
          shipping_height: null,
          shipping_weight: null,
          stripe_product_id: null,
          stripe_price_id: null,
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
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
            </DialogTitle>
            {!isEditing && formData.name.trim() && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <AlertCircle className="h-3 w-3" />
                <span>Autoguardado activado</span>
              </div>
            )}
          </div>
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
