import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Share2, Pencil } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import ProductImages from '@/components/product/ProductImages';
import ReviewForm from '@/components/product/ReviewForm';
import ReviewsList from '@/components/product/ReviewsList';
import EditProductDialog from '@/components/product/EditProductDialog';

const ProductDetail = () => {
  const { id: productIdParam } = useParams();
  const productId = parseInt(productIdParam);
  const { user } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '', name: '' });
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [product, setProduct] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

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

  const renderPrice = () => {
    if (!price || !price.type) return <p className="text-gray-500">Precio variable</p>;
    if (price.type === 'fixed') return <p className="text-xl">{price.value} €</p>;
    if (price.type === 'byQuantity') {
      const sorted = [...price.tiers].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      const min = sorted?.[0]?.price;
      return (
        <>
          <p className="text-xl">Desde {min} €</p>
          <ul className="mt-1 text-sm list-disc pl-4">
            {sorted.map((t, i) => (
              <li key={i}>{t.quantity}+ unidades: {t.price} €/ud</li>
            ))}
          </ul>
        </>
      );
    }
    if (price.type === 'byReason') {
      return (
        <>
          <p className="text-xl">Desde {price.base} euros</p>
          <ul className="mt-1 text-sm list-disc pl-4">
            {price.reasons?.map((r, i) => (
              <li key={i}>+{r.increment} € por {r.reason}</li>
            ))}
          </ul>
        </>
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

          <div className="mb-4">
            {renderPrice()}
          </div>

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
