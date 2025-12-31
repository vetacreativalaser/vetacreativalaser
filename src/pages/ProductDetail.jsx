import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Share2, Pencil, ShoppingCart, TrendingDown } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import ProductImages from '@/components/product/ProductImages';
import ReviewForm from '@/components/product/ReviewForm';
import ReviewsList from '@/components/product/ReviewsList';
import EditProductDialog from '@/components/product/EditProductDialog';
import ProductCustomizer from '@/components/commerce/product/ProductCustomizer';
import { useCartStore } from '@/store/useCartStore';
import { calculateUnitPrice, formatPrice, getTierInfo, normalizePriceConfig } from '@/lib/priceUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const getParsedAlts = Array.isArray(product.image_alts) ? product.image_alts : [];
  const price = product.price;

  // Handler para añadir al carrito
  const handleAddToCart = () => {
    if (!product.stripe_enabled) {
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
      openCart(); // Abrir el drawer automáticamente
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: 'Error',
        description: 'No se pudo añadir el producto al carrito.',
        variant: 'destructive'
      });
    }
  };

  // Calcular precio dinámico usando priceUtils
  const calculateCurrentPrice = () => {
    if (!price || !price.type) return null;

    // Para byReason: Si no hay motivo, usar el precio base
    if (price.type === 'byReason' && !selectedReason) {
      const basePrice = parseFloat(price.base) || 0;
      return { unitPrice: basePrice, total: basePrice * quantity };
    }

    try {
      const unitPrice = calculateUnitPrice(price, quantity, selectedReason);
      const total = unitPrice * quantity;
      return { unitPrice, total };
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
      return (
        <div>
          <p className="text-3xl font-bold">{formatPrice(price.value)}</p>
        </div>
      );
    }

    if (price.type === 'byQuantity') {
      const tierInfo = getTierInfo(price, quantity);
      const normalizedPrice = normalizePriceConfig(price);

      return (
        <div className="space-y-2">
          <p className="text-3xl font-bold">{formatPrice(tierInfo.currentPrice)}<span className="text-base font-normal text-muted-foreground">/unidad</span></p>

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

      return (
        <div className="space-y-2">
          {selectedReason ? (
            <p className="text-3xl font-bold">{formatPrice(calculateUnitPrice(price, quantity, selectedReason))}</p>
          ) : (
            <p className="text-3xl font-bold text-muted-foreground">Desde {formatPrice(basePrice)}</p>
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
        <ProductImages images={product.image_urls || []} alts={getParsedAlts} name={product.name} infinite={true} />

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

          <EditProductDialog open={isEditOpen} onOpenChange={setIsEditOpen} product={product} onUpdated={() => window.location.reload()} />

          {/* Precio dinámico */}
          <div className="mb-6">
            {renderPrice()}
          </div>

          {/* Selector de motivo (solo para byReason) */}
          {price?.type === 'byReason' && (
            <div className="mb-6 space-y-2">
              <Label htmlFor="reason-select">Motivo de compra <span className="text-destructive">*</span></Label>
              <select
                id="reason-select"
                value={selectedReason || ''}
                onChange={(e) => setSelectedReason(e.target.value || null)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="" key="default-option">Selecciona un motivo</option>
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

          {/* ProductCustomizer - Motor de personalización */}
          <ProductCustomizer
            customFields={product.custom_fields || []}
            values={customValues}
            onValuesChange={(values, isValid) => {
              setCustomValues(values);
              setIsCustomizationValid(isValid);
            }}
          />

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

          {/* Botón Añadir al Carrito */}
          <Button
            size="lg"
            className="w-full mb-6"
            onClick={handleAddToCart}
            disabled={
              !product.stripe_enabled ||
              !isCustomizationValid ||
              (price?.type === 'byReason' && !selectedReason)
            }
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {!product.stripe_enabled
              ? 'No disponible para compra online'
              : 'Añadir al carrito'}
          </Button>

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

            {/* Mensaje de proceso de compra (solo si no está habilitado Stripe) */}
            {!product.stripe_enabled && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md text-sm">
                <h3 className="font-semibold mb-2">Cómo Comprar</h3>
                <p>¡Gracias por tu interés! Al ser una empresa pequeña y artesanal, gestionamos los pedidos de forma personalizada.</p>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Contacta con nosotros a través de WhatsApp o email.</li>
                  <li>Indícanos el producto que te interesa y cualquier personalización.</li>
                  <li>Te confirmaremos los detalles y el precio final.</li>
                  <li>El pago se realiza de forma segura por Bizum o transferencia.</li>
                </ol>
                <p className="mt-2 italic text-xs text-gray-500">¡Soy una persona fiable! Puedes comprobar las reseñas de otros clientes.</p>
              </div>
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
