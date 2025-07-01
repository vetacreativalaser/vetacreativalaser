import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trash2, User, ShoppingBag, LayoutDashboard, Edit3, Save, Lock, Mail, Star, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog } from '@/components/ui/dialog';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [points, setPoints] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [allSlides, setAllSlides] = useState([]);
  const [serverLevel, setServerLevel] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const level = Math.floor(points / 100)
  const progress = points % 100;
  const nextLevel = level + 1;
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);


  useEffect(() => {
    const currentLevel = Math.floor(points / 100);

    // Solo si el nivel nuevo es mayor al que está en Supabase
    if (currentLevel > serverLevel) {
      // Actualizamos en Supabase
      supabase
        .from('profiles')
        .update({ level: currentLevel })
        .eq('email', user.email)
        .then(() => {
          setServerLevel(currentLevel); // actualizamos en React también

          // Enviamos el correo
          sendLevelUpEmail(user.email, formData.name || user.user_metadata?.name || '', currentLevel);
        })
        .catch((err) => {
          console.error('Error actualizando nivel en Supabase:', err.message);
        });
    }
  }, [points]);



  const refreshReviews = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.error('Error cargando reseñas:', error.message);
    setReviews(data || []);
  };
 const sendLevelUpEmail = async (email, name, level) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    await fetch('https://dspsrnprvrpjrkicxiso.functions.supabase.co/send-points-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        email,
        name,
        level,
        changeType: 'levelup'
      })
    });

  } catch (error) {
    console.error('Error al enviar correo de subida de nivel:', error);
  }
};

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('points, name, phone, level')
        .eq('email', user.email)
        .single();

      if (profile) {
      setPoints(profile.points || 0);
      setServerLevel(profile.level || 0); // 👈 nuevo estado
      setFormData({
      name: profile.name || user.user_metadata?.name || '',
      email: user.email || '',
      phone: profile.phone || user.user_metadata?.phone || ''
      });}

      const { data: favs } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id);
      setFavorites(favs || []);

      const { data: productList } = await supabase
        .from('products')
        .select('id, name');
      setProducts(productList || []);

      const { data: purchaseData } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPurchases(purchaseData || []);

      await refreshReviews();
      setLoading(false);
    };
    
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const slides = [];
    reviews.forEach((review) => {
      const imageUrls = typeof review.image_urls === 'string' ? JSON.parse(review.image_urls) : review.image_urls;
      if (Array.isArray(imageUrls)) {
        imageUrls.forEach((url) => {
          slides.push({ url, review });
        });
      }
    });
    setAllSlides(slides);
  }, [reviews]);
 useEffect(() => {
  const fetchEmails = async () => {
    const uniqueIds = [...new Set(reviews.map((r) => r.user_id))];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name')
      .in('id', uniqueIds);

    if (!error && data) {
      const emailMap = {};
      data.forEach((u) => {
        emailMap[u.id] = { email: u.email, name: u.name };
      });
      // FALTA: setUserEmails(emailMap)
    }
  };

  const slides = [];
  reviews.forEach((review) => {
    const imageUrls = typeof review.image_urls === 'string' ? JSON.parse(review.image_urls) : review.image_urls;
    if (Array.isArray(imageUrls)) {
      imageUrls.forEach((url) => {
        slides.push({ url, review });
      });
    }
  });
  setAllSlides(slides);

  if (reviews.length > 0) fetchEmails();
}, [reviews]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    if (isEditing) handleSaveProfile();
    else setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!currentPassword) return alert('Introduce tu contraseña para confirmar.');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });
    if (authError) return alert('Contraseña incorrecta.');

    await supabase.auth.updateUser({ data: { name: formData.name, phone: formData.phone } });
    await supabase.from('profiles').update({ name: formData.name, phone: formData.phone }).eq('email', user.email);
    setIsEditing(false);
    setCurrentPassword('');
  };

const handlePasswordChange = async () => {
  if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
    return alert('Verifica las contraseñas.');
  }

  setIsUpdatingPassword(true);
  setPasswordUpdated(false);

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  setIsUpdatingPassword(false);

  if (!error) {
    setPasswordUpdated(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordUpdated(false), 3000); // quitar check después de 3s
  } else {
    alert('Error al actualizar la contraseña.');
  }
};


  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const openLightbox = (review, index) => {
    const imageUrls = typeof review.image_urls === 'string' ? JSON.parse(review.image_urls) : review.image_urls;
    const globalIndex = allSlides.findIndex(
      (slide) => slide.review.id === review.id && imageUrls[index] === slide.url
    );
    setSelectedImageIndex(globalIndex);
    setSelectedReview(review);
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
    setSelectedReview(null);
  };

  const handleDelete = async (review) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta reseña?')) return;
    try {
      const urls = typeof review.image_urls === 'string'
        ? JSON.parse(review.image_urls)
        : review.image_urls;

      if (Array.isArray(urls) && urls.length > 0) {
        const paths = urls.map(url => decodeURIComponent(new URL(url).pathname.split('/storage/v1/object/public/reviews/')[1]));
        if (paths.length > 0) {
          await supabase.storage.from('reviews').remove(paths);
        }
      }

      await supabase.from('reviews').delete().eq('id', review.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('points, name')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        const updatedPoints = Math.max(0, profile.points - 5);
        await supabase
          .from('profiles')
          .update({ points: updatedPoints })
          .eq('id', user.id);

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
            changeType: 'lose'
          })
        });
      }

      refreshReviews();
    } catch (error) {
      console.error('Error al eliminar reseña:', error);
    }
  };

  
  const isAdmin = user.email === 'vetacreativalaser@gmail.com';

  if (loading || !user) return <p className="text-center p-10">Cargando perfil...</p>;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 text-center sm:text-left">
        <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto sm:mx-0">
            <User className="w-10 h-10 text-gray-500" />
          </div>
          <div className="mt-2 sm:mt-0">
            <h1 className="text-2xl font-bold text-black">{user.name}</h1>
            <p className="text-sm text-gray-600">Nivel {level} · {points} puntos</p>
          </div>
        </div>
        <div className="flex justify-center sm:justify-end gap-2 flex-wrap">
          {isAdmin && (
            <Link to="/admin/dashboard">
              <Button variant="secondary" className="text-xs w-full sm:w-auto">
                <LayoutDashboard className="w-4 h-4 mr-1" /> Administrador
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Tabs defaultValue="principal" >
      <TabsList className="flex flex-wrap sm:grid sm:grid-cols-4 gap-2 w-full mb-6 justify-center bg-gray-100 rounded-t-xl px-4 py-3 min-h-[64px] border-b border-gray-200 shadow-none">
          <TabsTrigger value="principal" className="flex flex-col items-center text-xs sm:text-sm rounded-t-xl focus:outline-none data-[state=active]:bg-[#ffffff] data-[state=active]:shadow-none">
            <User className="w-5 h-5 mb-1" />
            Principal
          </TabsTrigger>
          <TabsTrigger value="info" className="flex flex-col items-center text-xs sm:text-sm rounded-t-xl focus:outline-none data-[state=active]:bg-[#ffffff] data-[state=active]:shadow-none">
            <Mail className="w-5 h-5 mb-1" />
            Info
          </TabsTrigger>
          <TabsTrigger value="compras" className="flex flex-col items-center text-xs sm:text-sm rounded-t-xl focus:outline-none data-[state=active]:bg-[#ffffff] data-[state=active]:shadow-none">
            <ShoppingBag className="w-5 h-5 mb-1" />
            Compras
          </TabsTrigger>
          <TabsTrigger value="reseñas" className="flex flex-col items-center text-xs sm:text-sm rounded-t-xl focus:outline-none data-[state=active]:bg-[#ffffff] data-[state=active]:shadow-none">
            <Star className="w-5 h-5 mb-1" />
            Reseñas
          </TabsTrigger>
        </TabsList>
        <div className="  flex flex-col gap-6 sm:gap-2 px-4">
            
            <TabsContent value="principal" >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl p-4 bg-white shadow-md border">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-lg">Progreso</h2>
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-bold shadow">
                    {level}
                  </div>
                  <span className="text-xs text-gray-600 mt-1">nivel</span>
                </div>
              </div>

              <p className="text-sm">Puntos: {points}</p>
              <div className="mt-2 w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {progress > 98
                  ? `Te falta ${100 - progress} punto para subir al nivel ${nextLevel}.`
                  : `Te faltan ${100 - progress} puntos para alcanzar el nivel ${nextLevel}. ¡Sigue así!`}
              </p>
            </div>


            <div className="rounded-2xl p-4 bg-white shadow-md border">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-lg">Favoritos</h2>
                <Link to="/favoritos"><Button size="sm" variant="link">Ver todos</Button></Link>
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                {favorites.slice(0, 4).map((fav) => {
                  const product = products.find(p => p.id === fav.product_id);
                  return (
                    <li key={fav.id}>• {product?.name || 'Producto eliminado'}</li>
                  );
                })}
                {favorites.length === 0 && <li>No hay favoritos</li>}
              </ul>
            </div>

            <div className="rounded-2xl p-4 bg-white shadow-md border">
              <h2 className="font-semibold text-lg mb-2">Recompensas</h2>
              <p className="text-sm text-gray-600 mb-1">Cada 100 puntos subes un nivel.</p>
              <p className="text-sm text-gray-600">Recibirás regalos sorpresa por correo al subir de nivel 🎁</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="info">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 bg-white border shadow-md rounded-2xl space-y-4">
              <h2 className="text-lg font-semibold">Datos de contacto</h2>
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} disabled={!isEditing} />
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" value={formData.email} disabled className="bg-gray-100" />
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} disabled={!isEditing} />
              {isEditing && (
                <>
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <Input id="currentPassword" name="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </>
              )}
              <Button onClick={handleEditToggle} variant={isEditing ? 'default' : 'outline'}>
                {isEditing ? <><Save className="w-4 h-4 mr-1" />Guardar</> : <><Edit3 className="w-4 h-4 mr-1" />Editar</>}
              </Button>
              {!isEditing && (
                <Link to="/forgot-password">
                  <Button variant="link" className="text-sm text-gray-600 ml-4 hover:text-black p-0 h-auto">¿Olvidaste tu contraseña?</Button>
                </Link>
              )}
            </div>

            <div className="p-4 bg-white border shadow-md rounded-2xl space-y-4">
              <h2 className="text-lg font-s emibold">Cambiar contraseña</h2>
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <Label htmlFor="currentPassword">Contraseña actual</Label>
              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              <div className="flex items-center gap-2">
                <Button onClick={handlePasswordChange} variant="default" disabled={isUpdatingPassword}>
                  Actualizar contraseña
                </Button>

                {isUpdatingPassword && (
                  <div className="  w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                )}

                {passwordUpdated && (
                  <div className="text-green-600 text-lg font-bold">✓</div>
                )}
              </div>

            </div>

            <div className="p-4 bg-white border shadow-md rounded-2xl space-y-4">
              <h2 className="text-lg font-semibold">Contacto</h2>
              <p className="text-sm text-gray-600">¿Tienes alguna duda o problema? Escríbenos a:</p>
              <a
                href="https://mail.google.com/mail/?view=cm&to=vetacreativalaser@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-800 hover:underline"
              >
                <Mail className="w-4 h-4" />
                vetacreativalaser@gmail.com
              </a>


            </div>
          </div>
        </TabsContent>

        <TabsContent value="compras">
          {purchases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purchases.map(purchase => (
                <div key={purchase.id} className="p-4 bg-white border shadow-md rounded-2xl">
                  <h3 className="font-medium text-black flex items-center"><ShoppingBag className="mr-2 h-4 w-4" /> {purchase.name || 'Compra'}</h3>
                  <p className="text-gray-600 text-sm mt-1">{purchase.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      purchase.status === 'En preparación' ? 'bg-yellow-100 text-yellow-800' :
                      purchase.status === 'Enviado' ? 'bg-blue-100 text-blue-800' :
                      purchase.status === 'Finalizada' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {purchase.status || 'Sin estado'}
                    </span>
                    <p className="text-xs text-gray-500">{new Date(purchase.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aún no has realizado ninguna compra.</p>
          )}
        </TabsContent>

       <TabsContent value="reseñas">
  {reviews.length === 0 ? (
    <p className="text-gray-500">No has escrito reseñas todavía.</p>
  ) : (
    <div className="flex flex-col space-y-8 pt-4 pb-10 min-h-screen">
      {reviews.map((review) => {
        const imageUrls = typeof review.image_urls === 'string' ? JSON.parse(review.image_urls) : review.image_urls;
        const name = user.name?.split(' ').slice(0, 2).join(' ') || 'Usuario';

        const visibleImages = imageUrls?.slice(0, 2) || [];
        const extraImages = imageUrls?.length > 2 ? imageUrls.length - 2 : 0;
        const shouldStack = viewportWidth < 500;

        return (
          <div key={review.id} className="bg-white rounded-xl border shadow-sm p-4 select-none">
            <div className={`flex ${shouldStack ? 'flex-col' : 'flex-row items-start'} gap-4`}>
              <div className="flex-1 min-w-0 space-y-2 overflow-hidden">
                <p className="text-sm font-semibold text-black truncate">{name}</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star key={v} className={`w-4 h-4 ${v <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill={v <= review.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(review)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
                {review.product_id && (
                  <Link to={`/productos/${review.product_id}`} className="text-sm text-blue-600 hover:underline">
                    Ver producto
                  </Link>
                )}
                <p className="text-sm text-gray-700 text-justify break-words whitespace-pre-wrap">{review.content}</p>
              </div>

              {Array.isArray(imageUrls) && imageUrls.length > 0 && (
                <div className={`image-grid-2 ${shouldStack ? 'justify-start' : 'justify-center items-center self-center'}`}>
                  {visibleImages.map((url, index) => (
                    <div key={index} className="image-container">
                      <img
                        src={url}
                        onClick={() => openLightbox(review, index)}
                        className="review-image"
                        alt={`img-${index}`}
                        draggable={false}
                      />
                      {index === visibleImages.length - 1 && extraImages > 0 && (
                        <div className="image-overlay" onClick={() => openLightbox(review, index)}>
                          +{extraImages}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  )}

  {selectedImageIndex !== null && (
 <Dialog open={true} onOpenChange={closeLightbox}>
  <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={closeLightbox}>
    <div className="bg-white rounded shadow-lg max-w-3xl w-full p-4 relative" onClick={(e) => e.stopPropagation()}>
      <Swiper
        initialSlide={selectedImageIndex}
        modules={[Pagination, Navigation]}
        pagination={{ clickable: true }}
        loop
        allowTouchMove
        className="mb-4 select-none swiper"
        onSlideChange={({ activeIndex }) => {
          const newReview = allSlides[activeIndex]?.review;
          if (newReview?.id !== selectedReview?.id) {
            setSelectedReview(newReview);
          }
        }}
      >
        {allSlides.map((slide, i) => (
          <SwiperSlide key={i}>
            <img
              src={slide.url}
              alt={`slide-${i}`}
              className="w-full h-auto max-h-[70vh] object-contain mx-auto select-none"
              draggable={false}
            />
          </SwiperSlide>
        ))}
      </Swiper>
      <button
        onClick={() => document.querySelector('.swiper')?.swiper?.slidePrev()}
        className="custom-swiper-prev absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-opacity-90 z-10"
      >
        <ChevronLeft className="h-5 w-5 text-black" />
      </button>
      <button
        onClick={() => document.querySelector('.swiper')?.swiper?.slideNext()}
        className="custom-swiper-next absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-opacity-90 z-10"
      >
        <ChevronRight className="h-5 w-5 text-black" />
      </button>
      {selectedReview && (
        <div className="text-center text-sm">
          <p className="font-semibold text-black mb-1">{user.name?.split(' ').slice(0, 2).join(' ') || 'Usuario'}</p>
          <div className="flex justify-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((v) => (
              <Star key={v} className={`w-4 h-4 ${v <= selectedReview.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill={v <= selectedReview.rating ? 'currentColor' : 'none'} />
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
</Dialog>


  )}
</TabsContent>

        </div>
        

      </Tabs>
      <Button
        className="w-full sm:w-auto mt-8 border border-red-500 text-red-500 bg-white hover:bg-red-50"
        onClick={handleLogout}
      >
        Cerrar sesión
      </Button>

    </div>
  );
};

export default Profile;
