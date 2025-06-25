
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import Products from '@/pages/Products';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import ProductDetail from '@/pages/ProductDetail';
import FAQ from '@/pages/FAQ';
import Wishlist from '@/pages/Wishlist';
import WhatsAppButton from '@/components/WhatsAppButton';
import Profile from '@/pages/Profile';
import AdminDashboard from '@/pages/AdminDashboard';
import SearchResults from '@/pages/SearchResults';
import AuthPage from '@/pages/AuthPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import CreateProduct from '@/pages/admin/CreateProduct.jsx';
import TermsAndConditions from '@/pages/legal/TermsAndConditions';
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy';
import CookiePolicy from '@/pages/legal/CookiePolicy';
import BuyingGuides from '@/pages/legal/BuyingGuides';

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
