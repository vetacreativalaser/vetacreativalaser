import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const Home = lazy(() => import('@/pages/Home'));
const Products = lazy(() => import('@/pages/Products'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const Wishlist = lazy(() => import('@/pages/Wishlist'));
const Profile = lazy(() => import('@/pages/Profile'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const CreateProduct = lazy(() => import('@/pages/admin/CreateProduct.jsx'));
const SearchResults = lazy(() => import('@/pages/SearchResults'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const TermsAndConditions = lazy(() => import('@/pages/legal/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('@/pages/legal/PrivacyPolicy'));
const CookiePolicy = lazy(() => import('@/pages/legal/CookiePolicy'));
const BuyingGuides = lazy(() => import('@/pages/legal/BuyingGuides'));

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div>; 
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (adminOnly && user.email !== 'vetacreativalaser@gmail.com') {
    return <Navigate to="/perfil" />;
  }

  return children;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function AppContent() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col overflow-x-hidden ">
      <Header />
      <main className="pt-28 flex-grow">
        <ScrollToTop />
        <Suspense fallback={<div className="text-center py-12">Cargando...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/productos" element={<Products />} />
            <Route path="/productos/:id" element={<ProductDetail />} />
            <Route path="/sobre-nosotros" element={<About />} />
            <Route path="/contacto" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/auth" element={<AuthPage />} /> 
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/buscar" element={<SearchResults />} />
            <Route path="/terminos-y-condiciones" element={<TermsAndConditions />} />
            <Route path="/politica-de-privacidad" element={<PrivacyPolicy />} />
            <Route path="/politica-de-cookies" element={<CookiePolicy />} />
            <Route path="/guias-de-compra" element={<BuyingGuides />} />

            <Route path="/favoritos" element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/crear-producto" element={
              <ProtectedRoute adminOnly={true}>
                <CreateProduct />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Navigate to="/auth?mode=login" replace />} />
            <Route path="/registro" element={<Navigate to="/auth?mode=register" replace />} />
            <Route path="/lista-de-deseos" element={<Navigate to="/favoritos" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <WhatsAppButton />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
