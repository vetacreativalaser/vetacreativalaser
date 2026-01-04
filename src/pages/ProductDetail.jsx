import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Share2, Pencil, ShoppingCart, TrendingDown, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import ProductImages from '@/components/product/ProductImages';
import ReviewForm from '@/components/product/ReviewForm';
import ReviewsList from '@/components/product/ReviewsList';
import ProductForm from '@/components/admin/products/ProductForm';
import ProductCustomizer from '@/components/commerce/product/ProductCustomizer';
import { useCartStore } from '@/store/useCartStore';
import { calculateUnitPrice, formatPrice, getTierInfo, normalizePriceConfig } from '@/lib/priceUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useShopPauseStatus } from '@/hooks/useShopPauseStatus';

const ProductDetail = () => {
  const { id: productIdParam } = useParams();
  const productId = parseInt(productIdParam);
  const { user } = useAuth();

  // Estado existente
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '', name: '' });
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [product, setProduct] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

  // Estado para E-commerce (NUEVO)
  const [quantity, setQuantity] = useState(1);
  const [customValues, setCustomValues] = useState({});
  const [isCustomizationValid, setIsCustomizationValid] = useState(true);
  const [selectedReason, setSelectedReason] = useState(null);

  // Zustand store
  const { addItem, openCart } = useCartStore();

  // Hook para verificar si las compras están pausadas
  const { isPaused, pauseMessage } = useShopPauseStatus();

  const fetchReviews = async (id) => {
    setIsLoadingReview(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: false });

    if (!error) setReviews(data || []);
    setIsLoadingReview(false);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoadingProduct(true);
      const { data: productsData, error: productsError } = await supabase.from('products').select('*');
      if (productsError) {
        toast({ title: 'Error', description: 'No se pudieron cargar los productos.', variant: 'destructive' });
        setIsLoadingProduct(false);
        return;
      }
      const currentProduct = productsData.find(p => String(p.id) === String(productId));
      if (!currentProduct) {
        setProduct(null);
        setIsLoadingProduct(false);
        return;
      }
      const fixedProduct = {
        ...currentProduct,
        // Formato nuevo (JSONB)
        images: typeof currentProduct.images === 'string' ? JSON.parse(currentProduct.images) : currentProduct.images,
        // Formato antiguo (compatibilidad)
        image_urls: typeof currentProduct.image_urls === 'string' ? JSON.parse(currentProduct.image_urls) : currentProduct.image_urls,
        image_alts: typeof currentProduct.image_alts === 'string' ? JSON.parse(currentProduct.image_alts) : currentProduct.image_alts,
        specifications: typeof currentProduct.specifications === 'string' ? JSON.parse(currentProduct.specifications) : currentProduct.specifications,
        price: typeof currentProduct.price === 'string' ? JSON.parse(currentProduct.price) : currentProduct.price
      };

      setProduct(fixedProduct);
      await fetchReviews(fixedProduct.id);

      if (user) {
        setIsLoadingFavorite(true);
        const { data, error } = await supabase.from('favorites').select('*').eq('user_id', user.id).eq('product_id', fixedProduct.id).maybeSingle();
        if (!error) setIsFavorite(!!data);
        setIsLoadingFavorite(false);
      }
      setIsLoadingProduct(false);
    };
    fetchProduct();
  }, [productId, user]);

  const toggleFavorite = async () => {
    if (!user) return toast({ title: 'Inicia sesión', description: 'Debes iniciar sesión para añadir a favoritos.', variant: 'destructive' });
    setIsLoadingFavorite(true);
    if (isFavorite) await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', product.id);
    else await supabase.from('favorites').insert([{ user_id: user.id, product_id: product.id }]);
    setIsFavorite(!isFavorite);
    setIsLoadingFavorite(false);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      navigator.share({ title: document.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: 'Enlace copiado', description: 'Se ha copiado el enlace al portapapeles.' });
    }
  };

  if (isLoadingProduct) return <p className="text-center py-8">Cargando producto...</p>;
  if (!product) return <p className="text-center py-8">Producto no encontrado</p>;

  // Normalizar imágenes para soportar formato nuevo (JSONB) y antiguo (arrays separados)
  const getProductImages = () => {
    // Formato nuevo: images JSONB array [{id, url, alt, text, position}]
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return {
        urls: product.images.map(img => img.url),
        alts: product.images.map(img => img.alt || '')
      };
    }

    // Formato antiguo: image_urls y image_alts arrays separados
    const urls = Array.isArray(product.image_urls) ? product.image_urls : [];
    const alts = Array.isArray(product.image_alts) ? product.image_alts : [];

    return { urls, alts };
  };

  const { urls: imageUrls, alts: imageAlts } = getProductImages();
  const price = product.price;

  // Handler para añadir al carrito
  const handleAddToCart = () => {
    if (product.purchase_mode !== 'standard') {
      toast({
        title: 'Producto no disponible',
        description: 'Este producto aún no está habilitado para compra online.',
        variant: 'destructive'
      });
      return;
    }

    if (!isCustomizationValid) {
      toast({
        title: 'Completa la personalización',
        description: 'Por favor, completa todos los campos obligatorios.',
        variant: 'destructive'
      });
      return;
    }

    try {
      addItem(product, quantity, customValues, selectedReason);
      toast({
        title: '¡Añadido al carrito!',
        description: `${quantity} x ${product.name} añadido correctamente.`,
      });
      openCart();
    } catch (error) {
      console.error('Error al añadir al carrito:', error);
      toast({
        title: 'Error',
        description: 'No se pudo añadir el producto al carrito.',
        variant: 'destructive'
      });
    }
  };

  // Calcular extras de personalización (mismo patrón que create-checkout Edge Function)
  const calculateCustomizationExtras = (customization) => {
    let extrasTotal = 0;

    for (const [key, value] of Object.entries(customization)) {
      if (typeof value === 'string') {
        // Buscar patrones como "(+2€)", "(+2.5€)", "(+2)", etc.
        const extraMatch = value.match(/\(\+(\d+(?:\.\d+)?)\s*€?\)/);
        if (extraMatch) {
          const extraAmount = parseFloat(extraMatch[1]);
          extrasTotal += extraAmount;
        }
      }
    }

    return extrasTotal;
  };

  // Calcular precio dinámico usando priceUtils + extras de personalización
  const calculateCurrentPrice = () => {
    if (!price || !price.type) return null;

    // Para byReason: Si no hay motivo, usar el precio base
    if (price.type === 'byReason' && !selectedReason) {
      const basePrice = parseFloat(price.base) || 0;
      const extrasTotal = calculateCustomizationExtras(customValues);
      const unitPriceWithExtras = basePrice + extrasTotal;
      return {
        unitPrice: basePrice,
        extrasTotal,
        unitPriceWithExtras,
        total: unitPriceWithExtras * quantity
      };
    }

    try {
      const baseUnitPrice = calculateUnitPrice(price, quantity, selectedReason);
      const extrasTotal = calculateCustomizationExtras(customValues);
      const unitPriceWithExtras = baseUnitPrice + extrasTotal;
      const total = unitPriceWithExtras * quantity;

      return {
        unitPrice: baseUnitPrice,
        extrasTotal,
        unitPriceWithExtras,
        total
      };
    } catch (error) {
      // Error en cálculo de precio (datos incorrectos en DB)
      // Los warnings ya se muestran en priceUtils.js
      return null;
    }
  };

  const currentPricing = calculateCurrentPrice();

  // Renderizar precio con lógica mejorada
  const renderPrice = () => {
    if (!price || !price.type) return <p className="text-gray-500">Precio variable</p>;

    if (price.type === 'fixed') {
      const basePrice = parseFloat(price.value) || 0;
      const extrasTotal = calculateCustomizationExtras(customValues);
      const finalPrice = basePrice + extrasTotal;

      return (
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{formatPrice(finalPrice)}</p>
            {extrasTotal > 0 && (
              <span className="text-sm text-muted-foreground line-through">{formatPrice(basePrice)}</span>
            )}
          </div>
          {extrasTotal > 0 && (
            <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-md">
              <span>Incluye extras de personalización: +{formatPrice(extrasTotal)}</span>
            </div>
          )}
        </div>
      );
    }

    if (price.type === 'byQuantity') {
      const tierInfo = getTierInfo(price, quantity);
      const normalizedPrice = normalizePriceConfig(price);
      const extrasTotal = calculateCustomizationExtras(customValues);
      const finalUnitPrice = tierInfo.currentPrice + extrasTotal;

      return (
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{formatPrice(finalUnitPrice)}<span className="text-base font-normal text-muted-foreground">/unidad</span></p>
            {extrasTotal > 0 && (
              <span className="text-sm text-muted-foreground line-through">{formatPrice(tierInfo.currentPrice)}/ud</span>
            )}
          </div>

          {extrasTotal > 0 && (
            <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-md">
              <span>Incluye extras de personalización: +{formatPrice(extrasTotal)}/unidad</span>
            </div>
          )}

          {/* Mostrar próximo descuento */}
          {tierInfo.nextTier && (
            <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 px-3 py-2 rounded-md">
              <TrendingDown className="w-4 h-4" />
              <span>
                Compra {tierInfo.nextTier.unitsNeeded} más para precio de {formatPrice(tierInfo.nextTier.price)}/ud
              </span>
            </div>
          )}

          {/* Tabla de precios escalonados */}
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Ver tabla de precios por cantidad
            </summary>
            <ul className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200">
              {normalizedPrice.tiers.map((tier, i) => {
                // Determinar texto de rango
                const rangeText = tier.max
                  ? `${tier.min}-${tier.max} unidades`
                  : `Más de ${tier.min} unidades`;

                // Determinar si es el tier actual (para resaltar)
                const isCurrentTier = quantity >= tier.min && (tier.max === null || quantity <= tier.max);

                return (
                  <li key={`tier-${i}-${tier.min}-${tier.price}`} className={isCurrentTier ? 'font-semibold text-primary' : ''}>
                    {rangeText}: {formatPrice(tier.price)}/ud
                  </li>
                );
              })}
            </ul>
          </details>
        </div>
      );
    }

    if (price.type === 'byReason') {
      // Usar el base price (siempre debe existir en formato antiguo)
      const basePrice = parseFloat(price.base) || 0;
      const extrasTotal = calculateCustomizationExtras(customValues);

      return (
        <div className="space-y-2">
          {selectedReason ? (
            <>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{formatPrice(calculateUnitPrice(price, quantity, selectedReason) + extrasTotal)}</p>
                {extrasTotal > 0 && (
                  <span className="text-sm text-muted-foreground line-through">{formatPrice(calculateUnitPrice(price, quantity, selectedReason))}</span>
                )}
              </div>
              {extrasTotal > 0 && (
                <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-md">
                  <span>Incluye extras de personalización: +{formatPrice(extrasTotal)}</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-3xl font-bold text-muted-foreground">Desde {formatPrice(basePrice + extrasTotal)}</p>
          )}
          <ul className="text-sm space-y-1">
            {price.reasons?.map((r) => {
              // Calcular precio normalizado para mostrar
              const displayPrice = r.price
                ? r.price
                : r.increment
                  ? basePrice + parseFloat(r.increment)
                  : basePrice;

              const label = r.label || r.reason;

              return (
                <li key={label} className={selectedReason === label ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                  {label}: {formatPrice(displayPrice)}
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
  };

  return (
    <div className="container py-8">
      <Link to="/productos" className="flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a productos
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProductImages images={imageUrls} alts={imageAlts} name={product.name} infinite={true} />

        <div className="relative">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-black mr-2">{product.name}</h1>
              {user?.email === "vetacreativalaser@gmail.com" && (
                <Button variant="outline" size="icon" onClick={() => setIsEditOpen(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="flex space-x-2 items-center">
              <Button variant="ghost" size="icon" onClick={toggleFavorite} disabled={isLoadingFavorite}>
                <Heart className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"} strokeWidth={1.5} />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="text-gray-500" />
              </Button>
            </div>
          </div>

          <ProductForm open={isEditOpen} onOpenChange={setIsEditOpen} product={product} onSaved={() => window.location.reload()} />

          {/* Alerta de producto inactivo/borrador */}
          {product.status !== 'active' && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="flex items-center gap-2">
                <span className="text-yellow-700 font-semibold">⚠️ Este producto está oculto (Borrador)</span>
              </div>
              <p className="text-sm text-yellow-600 mt-1">
                Solo visible para ti. Los clientes no pueden ver este producto en la tienda.
              </p>
            </div>
          )}

          {/* Precio dinámico */}
          <div className="mb-6">
            {renderPrice()}
          </div>

          {/* Selector de motivo (solo para byReason) */}
          {price?.type === 'byReason' && (
            <div className="mb-6 space-y-2">
              <Label htmlFor="reason-select">
                {price.selectorLabel || 'Selecciona una opción'} <span className="text-destructive">*</span>
              </Label>
              <select
                id="reason-select"
                value={selectedReason || ''}
                onChange={(e) => setSelectedReason(e.target.value || null)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="" key="default-option">{price.selectorLabel || 'Selecciona una opción'}</option>
                {price.reasons?.map((r) => {
                  // Calcular precio normalizado (base + increment si existe)
                  const displayPrice = r.price
                    ? r.price
                    : r.increment
                      ? (parseFloat(price.base) || 0) + parseFloat(r.increment)
                      : 0;

                  const label = r.label || r.reason;

                  return (
                    <option key={label} value={label}>
                      {label} - {formatPrice(displayPrice)}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* ProductCustomizer - Motor de personalización (oculto en byReason) */}
          {price?.type !== 'byReason' && (
            <ProductCustomizer
              customFields={product.custom_fields || []}
              values={customValues}
              onValuesChange={(values, isValid) => {
                setCustomValues(values);
                setIsCustomizationValid(isValid);
              }}
            />
          )}

          {/* Selector de cantidad */}
          <div className="mb-6 space-y-2">
            <Label htmlFor="quantity-input">Cantidad</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <Input
                id="quantity-input"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
              {currentPricing && currentPricing.total > 0 && (
                <span className="text-sm text-muted-foreground ml-2">
                  Total: <span className="font-semibold text-foreground">{formatPrice(currentPricing.total)}</span>
                </span>
              )}
              {price?.type === 'byReason' && !selectedReason && (
                <span className="text-sm text-muted-foreground ml-2 italic">
                  Selecciona un motivo para ver el precio
                </span>
              )}
            </div>
          </div>

          {/* Mensaje "Cómo Comprar" (solo si NO es standard) */}
          {product.purchase_mode !== 'standard' && (
            <div className="mb-4 p-4 bg-gray-50 rounded-md text-sm">
              <h3 className="font-semibold mb-2">Cómo comprar este producto</h3>
              <p>¡Gracias por tu interés! Este producto no se puede comprar directamente en la web debido a la cantidad de personalizaciones disponibles. Es mejor que hablemos y una vez concretada la personalización te mandemos el enlace de pago o quedameos localmente para entregartelo.</p>
              <ol className="list-decimal pl-5 mt-2 space-y-1">
                <li>Contacta con nosotros a través de WhatsApp o email.</li>
                <li>Indícanos el producto que te interesa y cualquier personalización.</li>
                <li>Te confirmaremos los detalles y el precio final.</li>
                <li>El pago se realiza de forma segura por Bizum, efectivo, enlace de producto, enlace de pago...Somos flexibles</li>
              </ol>
              <p className="mt-2 italic text-xs text-gray-500">¡Soy una persona fiable! Puedes comprobar las reseñas de otros clientes.</p>
            </div>
          )}

          {/* Mensaje de compras pausadas */}
          {isPaused && pauseMessage && product.purchase_mode === 'standard' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 leading-relaxed">{pauseMessage}</p>
              </div>
            </div>
          )}

          {/* Botón Añadir al Carrito / Contactar */}
          {product.purchase_mode === 'standard' ? (
            <Button
              size="lg"
              className="w-full mb-6"
              onClick={handleAddToCart}
              disabled={
                isPaused ||
                !isCustomizationValid ||
                (price?.type === 'byReason' && !selectedReason)
              }
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {isPaused ? 'Compras Pausadas' : 'Añadir al carrito'}
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full mb-6 bg-green-600 hover:bg-green-700"
              onClick={() => {
                const message = `Hola! Estoy interesado en el producto: ${product.name}${
                  selectedCustomization && Object.keys(selectedCustomization).length > 0
                    ? `\n\nPersonalización:\n${Object.entries(selectedCustomization)
                        .map(([key, value]) => `- ${key}: ${value}`)
                        .join('\n')}`
                    : ''
                }`;
                const whatsappUrl = `https://wa.me/642571133?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Contacta antes de comprar
            </Button>
          )}

          {/* Descripción y especificaciones */}
          <div className="text-justify">
            <h2 className="font-semibold text-lg mb-1">Descripción</h2>
            <p>{product.full_description}</p>

            {product.specifications && product.specifications.length > 0 && (
              <>
                <h3 className="font-semibold text-lg mt-6 mb-2">Especificaciones</h3>
                <ul className="list-disc pl-5">
                  {product.specifications.map((spec, idx) => (
                    <li key={idx}>{spec}</li>
                  ))}
                </ul>
              </>
            )}

          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Opiniones</h2>
        <ReviewForm productId={product.id} user={user} newReview={newReview} setNewReview={setNewReview} refreshReviews={() => fetchReviews(product.id)} />
        <ReviewsList reviews={reviews} user={user} refreshReviews={() => fetchReviews(product.id)} />
      </div>
    </div>
  );
};

export default ProductDetail;
