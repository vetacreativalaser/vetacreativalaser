import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import ProductImages from '@/components/product/ProductImages';
import ProductInfo from '@/components/product/ProductInfo';
import ReviewForm from '@/components/product/ReviewForm';
import ReviewsList from '@/components/product/ReviewsList';

const ProductDetail = () => {
  const { id: productIdParam } = useParams();
  const productId = parseInt(productIdParam);
  const { user } = useAuth();

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

    if (error) {
      console.error("Error fetching reviews:", error);
    } else {
      setReviews(data || []);
    }
    setIsLoadingReview(false);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoadingProduct(true);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) {
        console.error("Error fetching all products:", productsError);
        toast({ title: "Error", description: "No se pudieron cargar los productos.", variant: "destructive" });
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
        image_urls: typeof currentProduct.image_urls === 'string'
          ? JSON.parse(currentProduct.image_urls)
          : currentProduct.image_urls,
        specifications: typeof currentProduct.specifications === 'string'
          ? JSON.parse(currentProduct.specifications)
          : currentProduct.specifications,
        price: typeof currentProduct.price === 'string'
          ? JSON.parse(currentProduct.price)
          : currentProduct.price
      };

      setProduct(fixedProduct);
      await fetchReviews(fixedProduct.id);

      if (user) {
        setIsLoadingFavorite(true);
        const { data, error } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', fixedProduct.id)
          .maybeSingle();

        if (error) console.error("Error checking favorite:", error);
        else setIsFavorite(!!data);

        setIsLoadingFavorite(false);
      }

      setIsLoadingProduct(false);
    };

    fetchProduct();
  }, [productId, user]);

  if (isLoadingProduct) return <p className="text-center py-8">Cargando producto...</p>;
  if (!product) return <p className="text-center py-8">Producto no encontrado</p>;

  return (
    <div className="container py-8">
      <Link to="/productos" className="flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a productos
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProductImages
          images={product.image_urls || []}
          alts={product.image_alts || []}
          name={product.name}
        />
        <ProductInfo
          product={product}
          isFavorite={isFavorite}
          isLoadingFavorite={isLoadingFavorite}
        />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Opiniones</h2>
        <ReviewForm
          productId={product.id}
          user={user}
          newReview={newReview}
          setNewReview={setNewReview}
          refreshReviews={() => fetchReviews(product.id)}
        />
        <ReviewsList reviews={reviews} user={user} refreshReviews={() => fetchReviews(product.id)} />
      </div>
    </div>
  );
};

export default ProductDetail;
