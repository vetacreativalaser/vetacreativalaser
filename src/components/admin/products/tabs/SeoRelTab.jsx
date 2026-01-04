import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import {
  Search,
  X,
  Link as LinkIcon,
  Package,
  Check
} from 'lucide-react';

/**
 * SeoRelTab - SEO y Productos Relacionados
 *
 * Campos SEO:
 * - slug (URL amigable)
 * - seo_title (título meta)
 * - seo_description (descripción meta)
 *
 * Productos Relacionados:
 * - Buscador para seleccionar productos por nombre
 * - Array de IDs relacionados
 */
const SeoRelTab = ({ formData, updateField }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Cargar productos seleccionados al montar
  useEffect(() => {
    if (formData.related_products && formData.related_products.length > 0) {
      loadSelectedProducts();
    }
  }, [formData.related_products]);

  // Cargar detalles de productos relacionados
  const loadSelectedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, images')
        .in('id', formData.related_products);

      if (error) throw error;

      setSelectedProducts(data || []);
    } catch (error) {
      console.error('Error loading selected products:', error);
    }
  };

  // Obtener URL de imagen de un producto (maneja ambos formatos)
  const getProductImageUrl = (product) => {
    if (!product) return null;

    // Formato nuevo: images JSONB array
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0].url;
    }

    // Formato antiguo: image_urls array
    if (product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
      return product.image_urls[0];
    }

    return null;
  };

  // Buscar productos por nombre
  const searchProducts = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // Normalizar query: sin acentos, minúsculas
      const normalizedQuery = searchQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

      // Obtener TODOS los productos activos (el filtrado se hará en cliente)
      const { data, error } = await supabase
        .from('products')
        .select('id, name, images')
        .eq('status', 'active');

      if (error) throw error;

      // Filtrar en cliente: normalizar nombres y buscar coincidencia
      const relatedIds = formData.related_products || [];
      const filtered = (data || [])
        .filter(p => {
          // Excluir productos ya relacionados y el producto actual
          if (relatedIds.includes(p.id) || p.id === formData.id) return false;

          // Normalizar nombre del producto y buscar coincidencia
          const normalizedName = p.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          return normalizedName.includes(normalizedQuery);
        })
        .slice(0, 10); // Limitar a 10 resultados

      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Añadir producto relacionado
  const addRelatedProduct = (product) => {
    const relatedIds = formData.related_products || [];
    // Asegurar que el ID sea string (para compatibilidad con UUID)
    const productId = String(product.id);
    updateField('related_products', [...relatedIds, productId]);
    setSelectedProducts([...selectedProducts, product]);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Eliminar producto relacionado
  const removeRelatedProduct = (productId) => {
    const relatedIds = formData.related_products || [];
    updateField('related_products', relatedIds.filter(id => id !== productId));
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  // Generar slug desde el nombre
  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    updateField('slug', slug);
  };

  // Auto-completar SEO title si está vacío
  const autoFillSeoTitle = () => {
    if (!formData.seo_title && formData.name) {
      updateField('seo_title', formData.name);
    }
  };

  return (
    <div className="space-y-6">
      {/* SEO Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <LinkIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Optimización SEO
          </h3>
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug" className="text-sm font-medium">
            Slug (URL amigable)
          </Label>
          <div className="flex gap-2">
            <Input
              id="slug"
              placeholder="llavero-personalizado-madera"
              value={formData.slug}
              onChange={(e) => updateField('slug', e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={generateSlug}
              disabled={!formData.name}
            >
              Generar
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            URL del producto: <code className="bg-gray-100 px-2 py-1 rounded">/productos/{formData.slug || 'slug-del-producto'}</code>
          </p>
        </div>

        {/* SEO Title */}
        <div className="space-y-2">
          <Label htmlFor="seo-title" className="text-sm font-medium">
            Título SEO
          </Label>
          <div className="flex gap-2">
            <Input
              id="seo-title"
              placeholder={formData.name || 'Título para motores de búsqueda'}
              value={formData.seo_title}
              onChange={(e) => updateField('seo_title', e.target.value)}
              maxLength={60}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={autoFillSeoTitle}
              disabled={!formData.name || !!formData.seo_title}
            >
              Usar nombre
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs">
            <p className="text-gray-500">
              Recomendado: 50-60 caracteres
            </p>
            <p className={`font-medium ${formData.seo_title.length > 60 ? 'text-red-600' : 'text-gray-600'}`}>
              {formData.seo_title.length}/60
            </p>
          </div>
        </div>

        {/* SEO Description */}
        <div className="space-y-2">
          <Label htmlFor="seo-description" className="text-sm font-medium">
            Descripción SEO
          </Label>
          <Textarea
            id="seo-description"
            placeholder="Descripción breve que aparecerá en los resultados de búsqueda de Google"
            value={formData.seo_description}
            onChange={(e) => updateField('seo_description', e.target.value)}
            rows={3}
            maxLength={160}
            className="resize-none"
          />
          <div className="flex items-center justify-between text-xs">
            <p className="text-gray-500">
              Recomendado: 120-160 caracteres
            </p>
            <p className={`font-medium ${formData.seo_description.length > 160 ? 'text-red-600' : 'text-gray-600'}`}>
              {formData.seo_description.length}/160
            </p>
          </div>
        </div>

        {/* Preview Google */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Vista previa en Google:</p>
          <div className="space-y-1">
            <div className="text-blue-700 text-lg font-medium hover:underline cursor-pointer">
              {formData.seo_title || formData.name || 'Título del producto'}
            </div>
            <div className="text-green-700 text-xs">
              https://vetacreativa.com/productos/{formData.slug || 'slug-del-producto'}
            </div>
            <div className="text-gray-700 text-sm">
              {formData.seo_description || 'Descripción SEO del producto que aparecerá en los resultados de búsqueda.'}
            </div>
          </div>
        </div>
      </div>

      {/* Productos Relacionados Section */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <Package className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Productos Relacionados
          </h3>
        </div>

        <p className="text-xs text-gray-500">
          Selecciona productos relacionados para mostrar como sugerencias (cross-selling)
        </p>

        {/* Buscador */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre del producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchProducts()}
                className="pl-10"
              />
            </div>
            <Button
              type="button"
              onClick={searchProducts}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {searchResults.map((product) => {
                const imageUrl = getProductImageUrl(product);

                return (
                  <div
                    key={product.id}
                    className="p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Imagen pequeña */}
                    <div className="w-12 h-12 rounded border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Info del producto */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">ID: {product.id}</p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addRelatedProduct(product)}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Añadir
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="p-4 text-center text-sm text-gray-500 border border-gray-200 rounded-lg">
              No se encontraron productos
            </div>
          )}
        </div>

        {/* Productos seleccionados */}
        {selectedProducts.length > 0 ? (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Seleccionados ({selectedProducts.length})
            </Label>
            <div className="space-y-2">
              {selectedProducts.map((product) => {
                const imageUrl = getProductImageUrl(product);

                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    {/* Imagen pequeña */}
                    <div className="w-12 h-12 rounded border border-gray-200 overflow-hidden flex-shrink-0 bg-white">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Info del producto */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">ID: {product.id}</p>
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeRelatedProduct(product.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <Package className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Sin productos relacionados
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Usa el buscador para añadir productos
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeoRelTab;
