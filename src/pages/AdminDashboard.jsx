//Admin dashboard

//Importación de recursos

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Heart, ShoppingBag, PackagePlus, Trash2, Eye, Star as StarIcon, Copy, Mail, Phone, Calendar, Package } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extractImagePaths, parseImageUrls } from '@/lib/imageUtils';
import { Pencil } from "lucide-react";
import ShopConfigPanel from '@/components/admin/ShopConfigPanel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { getProductPopularity } from '../utils/getProductPopularity'; // ajusta la ruta si cambia
import CreateCategoryDialog from '@/components/product/CreateCategoryDialog';
import EditCategoryDialog from '@/components/product/EditCategoryDialog';
import ProductForm from '@/components/admin/products/ProductForm';
import OrderManagement from '@/components/admin/orders/OrderManagement';

const AdminDashboard = () => {

  //Declaración de constantes
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [searchTermUsers, setSearchTermUsers] = useState('');
  const [searchTermProducts, setSearchTermProducts] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [popularProducts, setPopularProducts] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const openCategoryModal = () => setIsCategoryModalOpen(true);
  const closeCategoryModal = () => setIsCategoryModalOpen(false);
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);

  // Estado para ProductForm
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Estado para detalles de usuario
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => {
    const fetchPopularity = async () => {
      const data = await getProductPopularity();
      setPopularProducts(data);
    };
    fetchPopularity();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
    fetchAdminData();
  }, []);

  // Detectar userId en URL y abrir diálogo de detalles
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId');

    if (userIdParam && users.length > 0) {
      const user = users.find(u => u.id === userIdParam);
      if (user) {
        handleViewUserDetails(user);
      }
    }
  }, [users]);

  //Funciones
  const fetchAdminData = async () => {
    setIsLoading(true);

    // 1) Perfiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, phone, purchase_count');
    if (profilesError) {
      console.error(profilesError);
      toast({ title: 'Error', description: 'No se pudieron cargar los perfiles.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    // 2) Favoritos con productos
    const { data: favData, error: favError } = await supabase
      .from('favorites')
      .select('user_id, product_id, products(name)');

    if (favError) {
      console.error(favError);
      setIsLoading(false);
      return;
    }

    // 3) Categorías
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categorias')
      .select('*')
      .order('fijada', { ascending: false })
      .order('created_at', { ascending: false });

    if (categoriesError) {
      console.error(categoriesError);
      toast({ title: 'Error', description: 'No se pudieron cargar las categorías.', variant: 'destructive' });
    } else {
      setCategories(categoriesData);
    }

    // 4) Construir mapa de favoritos por usuario
    const favMap = {};
    favData.forEach(fav => {
      if (!favMap[fav.user_id]) favMap[fav.user_id] = [];
      favMap[fav.user_id].push({ id: fav.product_id, name: fav.products?.name || 'Sin nombre' });
    });

    // 5) Mezclar todo en users
    const usersWithDetails = profilesData.map(profile => ({
      ...profile,
      favorites_list: favMap[profile.id] || [],
      favorites_count: (favMap[profile.id] || []).length,
    }));

    setUsers(usersWithDetails);

    // 6) Productos, reseñas y pedidos (orders)
    const [{ data: productsData }, { data: reviewsData }, { data: ordersData }] = await Promise.all([
      supabase.from('products').select(`*,categorias (categoria)`).order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
    ]);

    setProducts(productsData || []);
    setPurchases(ordersData || []); // Ahora purchases contiene los datos de orders

    // Enriquecer reseñas con nombres de usuario y producto
    if (reviewsData && reviewsData.length > 0) {
      // Obtener IDs únicos de productos y usuarios
      const productIds = [...new Set(reviewsData.map(r => r.product_id).filter(Boolean))];
      const userIds = [...new Set(reviewsData.map(r => r.user_id).filter(Boolean))];

      // Fetch productos y usuarios en paralelo
      const [{ data: productsInfo }, { data: usersInfo }] = await Promise.all([
        productIds.length > 0
          ? supabase.from('products').select('id, name').in('id', productIds)
          : Promise.resolve({ data: [] }),
        userIds.length > 0
          ? supabase.from('profiles').select('id, name').in('id', userIds)
          : Promise.resolve({ data: [] })
      ]);

      // Crear mapas para búsqueda rápida
      const productMap = {};
      (productsInfo || []).forEach(p => { productMap[p.id] = p; });

      const userMap = {};
      (usersInfo || []).forEach(u => { userMap[u.id] = u; });

      // Enriquecer reseñas
      const enrichedReviews = reviewsData.map(review => ({
        ...review,
        userName: userMap[review.user_id]?.name || 'Usuario desconocido',
        productName: productMap[review.product_id]?.name || 'Producto eliminado',
        productId: productMap[review.product_id]?.id || null
      }));

      setReviews(enrichedReviews);
    } else {
      setReviews([]);
    }

    setIsLoading(false);
  };

  const exportUsersCSV = () => {
    const csvContent = [
      ['Nombre', 'Email', 'Teléfono', 'Compras', 'Favoritos'],
      ...users.map(u => [
        u.name,
        u.email,
        u.phone,
        u.purchase_count ?? 0,
        u.favorites_list.map(f => `${f.name} (${f.id})`).join(' | ')
      ])
    ]
    .map(row => row.map(value => `"${value}"`).join(','))
    .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'usuarios.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Ver detalles de usuario
  const handleViewUserDetails = async (user) => {
    setSelectedUser(user);
    setIsUserDetailsOpen(true);

    // Cargar pedidos del usuario
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserOrders(orders || []);
    } catch (error) {
      console.error('Error loading user orders:', error);
      setUserOrders([]);
    }
  };

  // Copiar al portapapeles
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado',
      description: `${label} copiado al portapapeles`,
    });
  };



  //Filtros

  const filteredUsers = users.filter(user =>
    (user.name && user.name.toLowerCase().includes(searchTermUsers.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTermUsers.toLowerCase()))
  );

  const filteredProducts = products.filter(product =>
    (product.name && product.name.toLowerCase().includes(searchTermProducts.toLowerCase())) ||
    (product.category && product.category.toLowerCase().includes(searchTermProducts.toLowerCase()))
  );


  //Products

  // Abrir ProductForm para editar o crear
  const handleEditProduct = (product = null) => {
    setEditingProduct(product); // null = modo creación, object = modo edición
    setIsProductFormOpen(true);
  };

  // Callback cuando se guarda un producto
  const handleProductSaved = (savedProduct) => {
    // Refrescar lista de productos
    fetchAdminData();
    setEditingProduct(null);
  };

    const handleDeleteProduct = async (productId) => {
    setIsLoading(true);
    try {
      // 1. Eliminar favoritos
      const { error: favError } = await supabase
        .from('favorites')
        .delete()
        .eq('product_id', productId);

      if (favError) throw favError;

      // 2. Obtener el producto para acceder a sus imágenes
      const { data: productData, error: productFetchError } = await supabase
        .from('products')
        .select('images')
        .eq('id', productId)
        .single();

      if (productFetchError) throw productFetchError;

      // 3. Borrar imágenes del producto del storage
      if (productData?.images && Array.isArray(productData.images) && productData.images.length > 0) {
        const imageUrls = productData.images.map(img => img.url);
        const imagePaths = extractImagePaths(imageUrls, 'productos');

        if (imagePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('productos')
            .remove(imagePaths);

          if (storageError) console.error('Error al borrar imágenes del producto:', storageError.message);
        }
      }

      // 4. Obtener las reseñas asociadas
      const { data: reviews, error: fetchReviewsError } = await supabase
        .from('reviews')
        .select('id, image_urls')
        .eq('product_id', productId);

      if (fetchReviewsError) throw fetchReviewsError;

      // 5. Borrar imágenes de reseñas del storage
      for (const review of reviews || []) {
        const urls = parseImageUrls(review.image_urls);
        const reviewImagePaths = extractImagePaths(urls, 'reviews');

        if (reviewImagePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('reviews')
            .remove(reviewImagePaths);

          if (storageError) console.error('Error al borrar imágenes de reseñas:', storageError.message);
        }
      }

      // 6. Eliminar reseñas asociadas al producto
      const { error: reviewsDeleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('product_id', productId);

      if (reviewsDeleteError) throw reviewsDeleteError;

      // 7. Eliminar el producto
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      toast({ title: "Producto Eliminado", description: "Producto e imágenes eliminados correctamente" });
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      toast({ title: "Error al eliminar producto", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  //Reviews

  const handleDeleteReview = async (reviewId) => {
    setIsLoading(true);
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);
    
    if (error) {
      toast({ title: "Error al eliminar reseña", description: error.message, variant: "destructive"});
    } else {
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast({ title: "Reseña Eliminada" });
    }
    setIsLoading(false);
  };

  //Categorias
const handleEditCategory = (cat) => {
  setEditingCategory(cat);
};

const handleToggleVisible = async (cat) => {
  const newVisible = !cat.visible;
  const { error } = await supabase.from('categorias').update({ visible: newVisible }).eq('id', cat.id);
  if (!error) {
    await supabase.from('products').update({ visible: newVisible }).eq('category_id', cat.id);
    fetchAdminData();
    toast({ title: "Categoría actualizada", description: `Ahora está ${newVisible ? 'visible' : 'oculta'}.` });
  }
};

const handleTogglePinned = async (cat) => {
  const newFijada = !cat.fijada;
  const { error } = await supabase.from('categorias').update({ fijada: newFijada }).eq('id', cat.id);
  if (!error) {
    fetchAdminData();
    toast({ title: "Prioridad actualizada", description: newFijada ? 'Categoría fijada' : 'Categoría desfijada' });
  }
};

const handleDeleteCategory = async (categoryId) => {
  setIsLoading(true);
  const { error } = await supabase.from('categorias').delete().eq('id', categoryId);
  if (error) {
    toast({ title: "Error al eliminar categoría", description: error.message, variant: "destructive" });
  } else {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    toast({ title: "Categoría Eliminada" });
  }
  setIsLoading(false);
};

  //Condiciones importantes

  if (isLoading && users.length === 0 && products.length === 0 && purchases.length === 0 && reviews.length === 0) { 
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div>;
  }




    
  //JSX del la página


  return (
    
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl sm:text-4xl font-semibold text-black text-center sm:text-left">Dashboard de Administrador</h1>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => handleEditProduct(null)}
                className="bg-black text-white hover:bg-gray-800 flex-1 sm:flex-initial"
              >
                <PackagePlus className="mr-2 h-5 w-5" /> Crear Producto
              </Button>
              <Button variant="outline" onClick={openCategoryModal}>
               Crear Categoría
             </Button>
            </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-1 sm:grid-cols-7 gap-2 p-2 rounded sm:bg-gray-200">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
              <TabsTrigger value="categories">Categorías</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>


          <div className="mt-[200px] sm:mt-2 flex flex-col gap-6 sm:gap-2 px-4">
            <TabsContent value="dashboard">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                  className="bg-white p-6 shadow border border-gray-200"
                >
                  <div className="flex items-center text-black mb-3">
                    <Users className="h-7 w-7 mr-3" strokeWidth={1.5}/>
                    <h2 className="text-xl font-semibold">Usuarios Registrados</h2>
                  </div>
                  <p className="text-4xl font-bold text-black">{users.length}</p>
                </motion.div>
          
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                  className="bg-white p-6 shadow border border-gray-200"
                >
                   <div className="flex items-center text-black mb-3">
                    <ShoppingBag className="h-7 w-7 mr-3" strokeWidth={1.5}/>
                    <h2 className="text-xl font-semibold">Total de Compras</h2>
                  </div>
                  <p className="text-4xl font-bold text-black">{purchases.length}</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                  className="bg-white p-6 shadow border border-gray-200"
                >
                   <div className="flex items-center text-black mb-3">
                    <StarIcon className="h-7 w-7 mr-3" strokeWidth={1.5}/>
                    <h2 className="text-xl font-semibold">Total de Reseñas</h2>
                  </div>
                  <p className="text-4xl font-bold text-black">{reviews.length}</p>
                </motion.div>
              </div>
           <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.4 }}
      className="bg-white p-6 shadow border border-gray-200 mb-8"
    >
      <div className="flex items-center text-black mb-3">
        <Heart className="h-7 w-7 mr-3" strokeWidth={1.5} />
        <h2 className="text-xl font-semibold">Productos Más Populares (Top 5)</h2>
      </div>

      <ul>
        {popularProducts.length === 0 ? (
          <li>Cargando productos...</li>
        ) : (
          popularProducts.map(({ name, count }) => (
            <li key={name} className="mb-2">
              <span className="font-medium">{name}</span> — {count} favoritos
            </li>
          ))
        )}
      </ul>
    </motion.div>


            </TabsContent>

            <TabsContent value="orders">
              <OrderManagement />
            </TabsContent>

            <TabsContent value="users">
              <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 shadow border border-gray-200 mb-8"
              >
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-black mb-2 sm:mb-0">Gestión de Usuarios</h2>
                  <Button size="sm" onClick={exportUsersCSV} className="bg-green-600 text-white hover:bg-green-700">Exportar CSV</Button>
                </div>

               

                <div className="mb-4 flex">
                  <Input
                    type="search"
                    placeholder="Buscar usuario por nombre o email..."
                    value={searchTermUsers}
                    onChange={(e) => setSearchTermUsers(e.target.value)}
                    className="max-w-sm mr-2 border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
       


                {isLoading && filteredUsers.length === 0 ? <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div></div> :
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Nombre</th>
                          <th scope="col" className="px-6 py-3">Email</th>
                          <th scope="col" className="px-6 py-3">Teléfono</th>
                          <th scope="col" className="px-6 py-3">Nº Compras</th>
                          <th scope="col" className="px-6 py-3">Favoritos</th>
                          <th scope="col" className="px-6 py-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(user => (
                          <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{user.name || 'N/A'}</td>
                            <td className="px-6 py-4">{user.email}</td>
                            <td className="px-6 py-4">{user.phone || '-'}</td>
                            <td className="px-6 py-4">{user.purchase_count || 0}</td>
                           <td className="px-6 py-4">
                              {user.favorites_list.length === 0 ? '—' : (
                                <ul className="list-disc list-inside text-xs text-gray-700">
                                  {user.favorites_list.map(f => (
                                    <li key={f.id}>{f.name} ({f.id})</li>
                                  ))}
                                </ul>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewUserDetails(user)}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Detalles
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredUsers.length === 0 && !isLoading && <p className="text-center py-4 text-gray-500">No se encontraron usuarios.</p>}
                  </div>
                }
              </motion.div>

              {/* User Details Dialog */}
              <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-blue-600">
                      Detalles del Usuario
                    </DialogTitle>
                  </DialogHeader>

                  {selectedUser && (
                    <div className="space-y-6">
                      {/* Información de Contacto - Destacada */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200">
                        <h3 className="text-lg font-semibold mb-4 text-blue-900 flex items-center">
                          <Users className="w-5 h-5 mr-2" />
                          Información de Contacto
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Nombre */}
                          <div className="bg-white p-4 rounded shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">Nombre</p>
                                <p className="font-semibold text-gray-900">{selectedUser.name || 'N/A'}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(selectedUser.name || '', 'Nombre')}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Email */}
                          <div className="bg-white p-4 rounded shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1 flex items-center">
                                  <Mail className="w-3 h-3 mr-1" />
                                  Email
                                </p>
                                <p className="font-semibold text-gray-900 break-all">{selectedUser.email}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(selectedUser.email, 'Email')}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Teléfono */}
                          <div className="bg-white p-4 rounded shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1 flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  Teléfono
                                </p>
                                <p className="font-semibold text-gray-900">{selectedUser.phone || 'No proporcionado'}</p>
                              </div>
                              {selectedUser.phone && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(selectedUser.phone, 'Teléfono')}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* User ID */}
                          <div className="bg-white p-4 rounded shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">ID de Usuario</p>
                                <p className="font-mono text-xs text-gray-700 break-all">{selectedUser.id}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(selectedUser.id, 'ID')}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Información Adicional */}
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                          <Calendar className="w-5 h-5 mr-2" />
                          Información de Cuenta
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Fecha de Registro</p>
                            <p className="font-medium text-gray-900">
                              {selectedUser.created_at
                                ? new Date(selectedUser.created_at).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Total de Compras</p>
                            <p className="font-medium text-gray-900">{selectedUser.purchase_count || 0} pedidos</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Productos Favoritos</p>
                            <p className="font-medium text-gray-900">{selectedUser.favorites_list?.length || 0} productos</p>
                          </div>
                        </div>
                      </div>

                      {/* Favoritos */}
                      {selectedUser.favorites_list && selectedUser.favorites_list.length > 0 && (
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                          <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                            <Heart className="w-5 h-5 mr-2 text-red-500" />
                            Productos Favoritos
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedUser.favorites_list.map((fav) => (
                              <div key={fav.id} className="bg-gray-50 p-3 rounded flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">{fav.name}</p>
                                  <p className="text-xs text-gray-500">ID: {fav.id}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pedidos del Usuario */}
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                          <Package className="w-5 h-5 mr-2 text-blue-600" />
                          Historial de Pedidos ({userOrders.length})
                        </h3>
                        {userOrders.length > 0 ? (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {userOrders.map((order) => (
                              <div key={order.id} className="bg-gray-50 p-4 rounded border border-gray-200">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="font-semibold text-gray-900">{order.order_number}</p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(order.created_at).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-blue-600">{order.total.toFixed(2)} €</p>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                      order.status === 'producing' ? 'bg-blue-100 text-blue-800' :
                                      order.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                                      order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {order.status === 'paid' ? 'Pagado' :
                                       order.status === 'producing' ? 'En Producción' :
                                       order.status === 'completed' ? 'Completado' :
                                       order.status === 'shipped' ? 'Enviado' :
                                       'Cancelado'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                  <p className="mb-1">
                                    <strong>Email de pago:</strong> {order.customer_email}
                                  </p>
                                  {order.items && order.items.length > 0 && (
                                    <p className="text-xs">
                                      {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-8">
                            Este usuario no tiene pedidos registrados
                          </p>
                        )}
                      </div>

                      {/* Acciones Rápidas */}
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Acciones Rápidas</h3>
                        <div className="flex flex-wrap gap-3">
                          {selectedUser.email && (
                            <Button
                              variant="outline"
                              onClick={() => window.location.href = `mailto:${selectedUser.email}`}
                              className="flex items-center"
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Enviar Email
                            </Button>
                          )}
                          {selectedUser.phone && (
                            <Button
                              variant="outline"
                              onClick={() => window.location.href = `tel:${selectedUser.phone}`}
                              className="flex items-center"
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Llamar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsUserDetailsOpen(false)}>
                      Cerrar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="products">
               <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 shadow border border-gray-200 mb-8"
              >
                <h2 className="text-2xl font-semibold text-black mb-6">Gestión de Productos</h2>
                <div className="mb-4 flex">
                  <Input
                    type="search"
                    placeholder="Buscar producto por nombre o categoría..."
                    value={searchTermProducts}
                    onChange={(e) => setSearchTermProducts(e.target.value)}
                    className="max-w-sm mr-2 border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>

                {isLoading && filteredProducts.length === 0 ? <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div></div> :
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Nombre</th>
                          <th scope="col" className="px-6 py-3">Categoría</th>
                          <th scope="col" className="px-6 py-3">Estado</th>
                          <th scope="col" className="px-6 py-3">Precio</th>
                          <th scope="col" className="px-6 py-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map(product => (
                          <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                            <td className="px-6 py-4">{product.categorias?.categoria || 'Sin categoría'}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                product.status === 'active' ? 'bg-green-100 text-green-800' :
                                product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                <span className={`w-2 h-2 rounded-full mr-1.5 ${
                                  product.status === 'active' ? 'bg-green-500' :
                                  product.status === 'draft' ? 'bg-yellow-500' :
                                  'bg-gray-400'
                                }`}></span>
                                {product.status === 'active' ? 'Activo' :
                                 product.status === 'draft' ? 'Borrador' :
                                 'Archivado'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {(() => {
                                try {
                                  const parsed = typeof product.price === 'string' ? JSON.parse(product.price) : product.price;
                                  if (parsed?.type === 'fixed') return parsed.value || parsed.fixedPrice;
                                  return 'var';
                                } catch (e) {
                                  return 'var';
                                }
                              })()}
                            </td>
                          <td className="px-6 py-4 flex space-x-2">
                              <Link to={`/productos/${product.id}`}>
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-100 p-1.5" disabled={isLoading}>
                                  <Eye className="h-4 w-4"/>
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:bg-green-100 p-1.5"
                                onClick={() => handleEditProduct(product)}
                                disabled={isLoading}
                              >
                                <Pencil className="h-4 w-4"/>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100 p-1.5" disabled={isLoading}>
                                    <Trash2 className="h-4 w-4"/>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Esto eliminará permanentemente el producto "{product.name}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-red-600 hover:bg-red-700">
                                      {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : null}
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredProducts.length === 0 && !isLoading && <p className="text-center py-4 text-gray-500">No se encontraron productos.</p>}
                  </div>
                }
              </motion.div>
            </TabsContent>

            <TabsContent value="reviews">
              <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 shadow border border-gray-200 mb-8"
              >
                <h2 className="text-2xl font-semibold text-black mb-6">Gestión de Reseñas</h2>
                {isLoading && reviews.length === 0 ? <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div></div> :
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Usuario</th>
                          <th scope="col" className="px-6 py-3">Producto</th>
                          <th scope="col" className="px-6 py-3">Puntuación</th>
                          <th scope="col" className="px-6 py-3">Fecha</th>
                          <th scope="col" className="px-6 py-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviews.map(review => (
                          <tr key={review.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{review.userName}</td>
                            <td className="px-6 py-4">
                              {review.productId ? (
                                <Link
                                  to={`/productos/${review.productId}`}
                                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                >
                                  {review.productName}
                                </Link>
                              ) : (
                                <span className="text-gray-500">{review.productName}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                  <StarIcon key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                  ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">{new Date(review.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100 p-1.5" disabled={isLoading}>
                                    <Trash2 className="h-4 w-4"/>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Esto eliminará permanentemente la reseña.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteReview(review.id)} className="bg-red-600 hover:bg-red-700">
                                      {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : null}
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {reviews.length === 0 && !isLoading && <p className="text-center py-4 text-gray-500">No se encontraron reseñas.</p>}
                  </div>
                }
              </motion.div>
            </TabsContent>
            <TabsContent value="categories">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 shadow border border-gray-200 mb-8"
              >
                <h2 className="text-2xl font-semibold text-black mb-6">Gestión de Categorías</h2>

                {categories.length === 0 ? (
                  <p className="text-gray-500">No hay categorías.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((cat) => (
                      <div key={cat.id} className="border p-4 bg-white shadow-sm rounded">
                        <img src={cat.image_url} alt={cat.title} className="w-full h-40 object-cover rounded mb-2" />
                        <h3 className="text-lg font-semibold">{cat.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{cat.description}</p>

                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" onClick={() => handleEditCategory(cat)}>Editar</Button>
                          <Button size="sm" variant="outline" onClick={() => handleToggleVisible(cat)}>{cat.visible ? 'Ocultar' : 'Mostrar'}</Button>
                          <Button size="sm" variant="outline" onClick={() => handleTogglePinned(cat)}>{cat.fijada ? 'Desfijar' : 'Fijar'}</Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">Eliminar</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                                <AlertDialogDescription>Esto la eliminará permanentemente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)}>Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              <EditCategoryDialog
                isOpen={!!editingCategory}
                setIsOpen={() => setEditingCategory(null)}
                category={editingCategory}
                onSuccess={() => fetchAdminData()}
              />
            </TabsContent>

            <TabsContent value="config">
              <ShopConfigPanel />
            </TabsContent>

          </div>
        </Tabs>
      </motion.div>

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <CreateCategoryDialog
  isOpen={isCategoryModalOpen}
  setIsOpen={setIsCategoryModalOpen}
  onSuccess={(newCat) => {
    setCategories(prev => [...prev, newCat]);
  }}
/>
        </DialogContent>
     </Dialog>

     {/* ProductForm Modal */}
     <ProductForm
       open={isProductFormOpen}
       onOpenChange={setIsProductFormOpen}
       product={editingProduct}
       onSaved={handleProductSaved}
     />
    </div>
  );
};

export default AdminDashboard;
