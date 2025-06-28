//Admin dashboard

//Importación de recursos

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Heart, ShoppingBag, PackagePlus, Trash2, Eye, PlusCircle, Star as StarIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil } from "lucide-react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { getProductPopularity } from '../utils/getProductPopularity'; // ajusta la ruta si cambia
import CreateCategoryDialog from '@/components/product/CreateCategoryDialog';
import EditCategoryDialog from '@/components/product/EditCategoryDialog';

const AdminDashboard = () => {

  //Declaración de constantes
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [searchTermUsers, setSearchTermUsers] = useState('');
  const [searchTermProducts, setSearchTermProducts] = useState('');
  const [searchTermPurchases, setSearchTermPurchases] = useState('');
  const [selectedUserForPurchase, setSelectedUserForPurchase] = useState(null);
  const [newPurchaseData, setNewPurchaseData] = useState({ user_email: '', name: '', description: '', status: 'En preparación' });
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editPurchaseData, setEditPurchaseData] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const purchaseStatusOptions = ['En preparación', 'Enviado', 'Finalizada'];
  const [popularProducts, setPopularProducts] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const openCategoryModal = () => setIsCategoryModalOpen(true);
  const closeCategoryModal = () => setIsCategoryModalOpen(false);
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);

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

  //Funciones
  const fetchAdminData = async () => {
    setIsLoading(true);

    // 1) Perfiles con puntos
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, phone, purchase_count, points');
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

    // 6) Productos, compras y reseñas
    const [{ data: productsData }, { data: purchasesData }, { data: reviewsData }] = await Promise.all([
      supabase.from('products').select(`*,categorias (categoria)`).order('created_at', { ascending: false }),
      supabase.from('purchases').select('*').order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
    ]);

    setProducts(productsData || []);
    setPurchases(purchasesData || []);
    setReviews(reviewsData || []);
    setIsLoading(false);
  };

  const exportUsersCSV = () => {
    const csvContent = [
      ['Nombre', 'Email', 'Teléfono', 'Puntos', 'Compras', 'Favoritos'],
      ...users.map(u => [
        u.name,
        u.email,
        u.phone,
        u.points ?? 0,
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

 

  
 
  //Filtros

  const filteredUsers = users.filter(user =>
    (user.name && user.name.toLowerCase().includes(searchTermUsers.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTermUsers.toLowerCase()))
  );

  const filteredProducts = products.filter(product =>
    (product.name && product.name.toLowerCase().includes(searchTermProducts.toLowerCase())) ||
    (product.category && product.category.toLowerCase().includes(searchTermProducts.toLowerCase()))
  );

  const filteredPurchases = purchases.filter(purchase =>
    (purchase.userName && purchase.userName.toLowerCase().includes(searchTermPurchases.toLowerCase())) ||
    (purchase.user_email && purchase.user_email.toLowerCase().includes(searchTermPurchases.toLowerCase())) ||
    (purchase.name && purchase.name.toLowerCase().includes(searchTermPurchases.toLowerCase())) ||
    (purchase.status && purchase.status.toLowerCase().includes(searchTermPurchases.toLowerCase()))
  );

  //Compras

  const openPurchaseDialog = (user = null) => {
    if (user) {
      setSelectedUserForPurchase(user);
      setNewPurchaseData({ user_email: user.email, name: '', description: '', status: 'En preparación' });
    } else {
      setSelectedUserForPurchase(null);
      setNewPurchaseData({ user_email: '', name: '', description: '', status: 'En preparación' });
    }
    setIsPurchaseDialogOpen(true);
  };
  const handleCreatePurchase = async () => {
  setIsLoading(true);
  const targetUserEmail = selectedUserForPurchase ? selectedUserForPurchase.email : newPurchaseData.user_email;

  if (!targetUserEmail || !newPurchaseData.name) {
    toast({ title: "Campos incompletos", description: "El email del usuario y el nombre de la compra son obligatorios.", variant: "destructive" });
    setIsLoading(false);
    return;
  }

  // Obtener user_id desde la tabla profiles en lugar de usar Admin API
  let targetUserId = selectedUserForPurchase ? selectedUserForPurchase.id : null;
  if (!targetUserId) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', targetUserEmail)
      .single();
    if (profileError) {
      console.error('Error obteniendo perfil:', profileError);
      toast({ title: "Error", description: "No se pudo obtener el ID de usuario.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    targetUserId = profileData.id;
  }

  const { data, error } = await supabase
    .from('purchases')
    .insert([{ ...newPurchaseData, user_email: targetUserEmail, user_id: targetUserId }])
    .select('*, profiles(name)')
    .single();

  if (error) {
    toast({ title: "Error al crear compra", description: error.message, variant: "destructive" });
  } else if (data) {
    setPurchases(prev => [{ ...data, userName: data.profiles?.name || data.user_email.split('@')[0] }, ...prev]);
    toast({ title: "Compra Creada", description: `La compra "${data.name}" ha sido creada para ${targetUserEmail}.` });
    setIsPurchaseDialogOpen(false);
    setNewPurchaseData({ user_email: '', name: '', description: '', status: 'En preparación' });
    setSelectedUserForPurchase(null);
  }
  setIsLoading(false);
  };

  const handleDeletePurchase = async (purchaseId) => {
    setIsLoading(true);
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', purchaseId);
    
    if (error) {
      toast({ title: "Error al eliminar compra", description: error.message, variant: "destructive"});
    } else {
      setPurchases(prev => prev.filter(p => p.id !== purchaseId));
      toast({ title: "Compra Eliminada" });
    }
    setIsLoading(false);
  };
  const handleEditPurchase = async () => {
    if (!editPurchaseData || !editPurchaseData.id) return;
    setIsLoading(true);

    const { error } = await supabase
      .from('purchases')
      .update({
        name: editPurchaseData.name,
        description: editPurchaseData.description,
        status: editPurchaseData.status
      })
      .eq('id', editPurchaseData.id);

    if (error) {
      toast({ title: "Error al editar compra", description: error.message, variant: "destructive" });
    } else {
      setPurchases(prev => prev.map(p => p.id === editPurchaseData.id ? { ...p, ...editPurchaseData } : p));
      toast({ title: "Compra Actualizada" });
      setIsEditDialogOpen(false);
      setEditPurchaseData(null);
    }
    setIsLoading(false);
  };

  //Products

    const handleDeleteProduct = async (productId) => {
    setIsLoading(true);
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      toast({ title: "Error al eliminar producto", description: error.message, variant: "destructive" });
    } else {
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      toast({ title: "Producto Eliminado" });
    }
    setIsLoading(false);
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
              <Button onClick={() => openPurchaseDialog()} className="bg-blue-600 text-white hover:bg-blue-700 flex-1 sm:flex-initial">
                  <ShoppingBag className="mr-2 h-5 w-5" /> Crear Compra
              </Button>
              <Link to="/admin/crear-producto" className="flex-1 sm:flex-initial">
                  <Button className="bg-black text-white hover:bg-gray-800 w-full">
                      <PackagePlus className="mr-2 h-5 w-5" /> Crear Producto
                  </Button>
              </Link>
              <Button variant="outline" onClick={openCategoryModal}>
               Crear Categoría
             </Button>
            </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-1 sm:grid-cols-6 gap-2 p-2 rounded sm:bg-gray-200">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
              <TabsTrigger value="categories">Categorías</TabsTrigger>

            <TabsTrigger value="purchases">Compras</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas</TabsTrigger>
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
                          <th scope="col" className="px-6 py-3">Puntos</th>
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

                            <td className="px-6 py-4">{user.points ?? 0}</td>
                            <td className="px-6 py-4">
                              <Button variant="outline" size="sm" onClick={() => openPurchaseDialog(user)} className="text-xs text-blue-600 border-blue-600 hover:bg-blue-100" disabled={isLoading}>
                                <PlusCircle className="h-3 w-3 mr-1"/> Añadir Compra
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
                          <th scope="col" className="px-6 py-3">Precio</th>
                          <th scope="col" className="px-6 py-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map(product => (
                          <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                            <td>{product.categorias?.categoria || 'Sin categoría'}</td>
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

            <TabsContent value="purchases">
              <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 shadow border border-gray-200 mb-8"
              >
                <h2 className="text-2xl font-semibold text-black mb-6">Gestión de Compras</h2>
                <div className="mb-4 flex">
                  <Input
                    type="search"
                    placeholder="Buscar compra..."
                    value={searchTermPurchases}
                    onChange={(e) => setSearchTermPurchases(e.target.value)}
                    className="max-w-sm mr-2 border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>

                {isLoading && filteredPurchases.length === 0 ? <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div></div> :
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Nombre Compra</th>
                          <th scope="col" className="px-6 py-3">Usuario</th>
                          <th scope="col" className="px-6 py-3">Email Usuario</th>
                          <th scope="col" className="px-6 py-3">Estado</th>
                          <th scope="col" className="px-6 py-3">Fecha</th>
                          <th scope="col" className="px-6 py-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPurchases.map(purchase => (
                          <tr key={purchase.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{purchase.name}</td>
                            <td className="px-6 py-4">{purchase.userName}</td>
                            <td className="px-6 py-4">{purchase.user_email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  purchase.status === 'En preparación' ? 'bg-yellow-100 text-yellow-800' :
                                  purchase.status === 'Enviado' ? 'bg-blue-100 text-blue-800' :
                                  purchase.status === 'Finalizada' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                  {purchase.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">{new Date(purchase.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-600 text-blue-600 hover:bg-blue-50 flex items-center gap-1"
                                onClick={() => {
                                  setEditPurchaseData(purchase);
                                  setIsEditDialogOpen(true);
                                }}
                                disabled={isLoading}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-100 p-1.5"
                                    disabled={isLoading}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Esto eliminará permanentemente la compra "{purchase.name}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeletePurchase(purchase.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {isLoading && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      )}
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredPurchases.length === 0 && !isLoading && <p className="text-center py-4 text-gray-500">No se encontraron compras.</p>}
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
                            <td className="px-6 py-4">{review.productName} (ID: {review.product_id})</td>
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


          </div>
        </Tabs>
      </motion.div>

      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Crear Nueva Compra</DialogTitle>
            <DialogDescription>
              {selectedUserForPurchase ? `Añadir compra para ${selectedUserForPurchase.name || selectedUserForPurchase.email}.` : "Completa los detalles de la nueva compra."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!selectedUserForPurchase && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="purchase-user-email" className="text-right">Email Usuario</Label>
                <Input id="purchase-user-email" type="email" value={newPurchaseData.user_email} onChange={(e) => setNewPurchaseData({...newPurchaseData, user_email: e.target.value})} className="col-span-3 border-gray-300 focus:border-black focus:ring-black" placeholder="email@ejemplo.com" disabled={isLoading}/>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="purchase-name" className="text-right">Nombre Compra</Label>
              <Input id="purchase-name" value={newPurchaseData.name} onChange={(e) => setNewPurchaseData({...newPurchaseData, name: e.target.value})} className="col-span-3 border-gray-300 focus:border-black focus:ring-black" placeholder="Ej: Pedido Especial San Valentín" disabled={isLoading}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="purchase-description" className="text-right">Descripción</Label>
              <Textarea id="purchase-description" value={newPurchaseData.description} onChange={(e) => setNewPurchaseData({...newPurchaseData, description: e.target.value})} className="col-span-3 border-gray-300 focus:border-black focus:ring-black" placeholder="Detalles del pedido..." disabled={isLoading}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="purchase-status" className="text-right">Estado</Label>
              <Select
                value={newPurchaseData.status}
                onValueChange={(value) => setNewPurchaseData({...newPurchaseData, status: value})}
                disabled={isLoading}
              >
                <SelectTrigger className="col-span-3 border-gray-300 focus:border-black focus:ring-black">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseStatusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-gray-300 text-black hover:bg-gray-100" disabled={isLoading}>Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleCreatePurchase} className="bg-black text-white hover:bg-gray-800" disabled={isLoading}>
              {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <PlusCircle className="mr-2 h-4 w-4"/>} Crear Compra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Compra</DialogTitle>
            <DialogDescription>Modifica los datos de la compra seleccionada.</DialogDescription>
          </DialogHeader>
          {editPurchaseData && (
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={editPurchaseData.name}
                  onChange={(e) => setEditPurchaseData({ ...editPurchaseData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={editPurchaseData.description || ''}
                  onChange={(e) => setEditPurchaseData({ ...editPurchaseData, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Select
                  value={editPurchaseData.status}
                  onValueChange={(value) => setEditPurchaseData({ ...editPurchaseData, status: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseStatusOptions.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleEditPurchase} disabled={isLoading}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    </div>
  );
};

export default AdminDashboard;
