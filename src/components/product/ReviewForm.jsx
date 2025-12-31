import React, { useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Send, Star } from 'lucide-react';
import compressImageToWebP from '@/lib/utils';

const ReviewForm = ({ user, productId, newReview, setNewReview, refreshReviews }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const imageInputRef = useRef();

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 6);
    const compressedImages = await Promise.all(
      files.map(async (file) => {
        const webpBlob = await compressImageToWebP(file, 0.7);
        return new File([webpBlob], `${Date.now()}_${file.name}.webp`, { type: 'image/webp' });
      })
    );
    setSelectedImages(compressedImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let image_urls = [];
      if (selectedImages.length > 0) {
        const uploads = await Promise.all(
          selectedImages.map(async (file) => {
            const { data, error } = await supabase.storage
              .from('reviews')
              .upload(`review-images/${user.id}/${file.name}`, file, {
                cacheControl: '3600',
                upsert: false,
              });
            if (error) throw error;
            const { data: publicUrlData } = supabase.storage
              .from('reviews')
              .getPublicUrl(`review-images/${user.id}/${file.name}`);
            return publicUrlData.publicUrl;
          })
        );
        image_urls = uploads;
      }

      const { error: insertError } = await supabase.from('reviews').insert({
        user_id: user.id,
        product_id: productId,
        content: newReview.comment,
        rating: newReview.rating,
        image_urls
      });

      if (insertError) throw insertError;

      // Añadir 5 puntos al perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('points, name')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        const updatedPoints = (profile.points || 0) + 5;
        await supabase
          .from('profiles')
          .update({ points: updatedPoints })
          .eq('id', user.id);

        // Enviar correo por puntos ganados
       const { data: { session } } = await supabase.auth.getSession();

        await fetch('https://dspsrnprvrpjrkicxiso.functions.supabase.co/send-points-update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            email: user.email,
            name: profile.name,
            points: updatedPoints,
            changeType: 'gain' // o 'lose'
          })
        });

      }

      setNewReview({ comment: '', rating: 0 });
      setSelectedImages([]);
      refreshReviews();
    } catch (error) {
      console.error('Error al enviar la reseña:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <p className="text-center text-gray-500">Inicia sesión para dejar una reseña.</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="comment">Tu reseña</Label>
        <Textarea
          id="comment"
          value={newReview.comment}
          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
          placeholder="Escribe tu opinión sobre el producto..."
          required
        />
      </div>
      <div>
        <Label htmlFor="rating">Valoración</Label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={`w-6 h-6 cursor-pointer ${value <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
              onClick={() => setNewReview({ ...newReview, rating: value })}
              fill={value <= newReview.rating ? 'currentColor' : 'none'}
            />
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="images" className="flex items-center gap-2 cursor-pointer">
          <ImageIcon className="w-5 h-5" /> Añadir imágenes (máx 6)
        </Label>
        <Input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          ref={imageInputRef}
          className="hidden"
        />
        <div className="flex gap-2 mt-2 overflow-x-auto">
          {selectedImages.map((img, index) => (
            <img
              key={index}
              src={URL.createObjectURL(img)}
              alt="preview"
              className="w-20 h-20 object-cover rounded border"
            />
          ))}
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Enviando...' : (
          <div className="flex items-center gap-2"><Send className="w-4 h-4" /> Enviar reseña</div>
        )}
      </Button>
    </form>
  );
};

export default ReviewForm;
