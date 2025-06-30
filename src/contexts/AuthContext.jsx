import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triedSession, setTriedSession] = useState(false);

  const fetchUserProfile = async (userId) => {
    const { data: userProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("❌ Error obteniendo perfil:", error);
      return null;
    }
    return userProfile;
  };

  const handleSession = async (session) => {
    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    const userProfile = await fetchUserProfile(session.user.id);
    setUser(userProfile ? { ...session.user, ...userProfile } : session.user);
    setLoading(false);
  };

  const tryGetSession = async (retry = 0) => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("❌ Error getSession:", error);
      if (retry < 3) {
        setTimeout(() => tryGetSession(retry + 1), 1000); // retry
      } else {
        setLoading(false);
      }
      return;
    }

    await handleSession(session);
    setTriedSession(true);
  };

  useEffect(() => {
    console.log('✅ AuthProvider montado');
    tryGetSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔁 Cambio de sesión:', _event);
      handleSession(session);
    });

    return () => {
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data.user) {
      let profile = await fetchUserProfile(data.user.id);

      if (!profile) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || '',
          phone: data.user.user_metadata?.phone || '',
          purchase_count: 0,
        });

        if (insertError) throw insertError;
      }

      setUser(profile ? { ...data.user, ...profile } : data.user);
    }

    return data;
  };

  const register = async (userData) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          phone: userData.phone,
          purchase_count: 0,
        },
      },
    });

    if (error) throw error;

    const user = data.user;
    if (!user?.id) throw new Error('No se pudo obtener el ID del usuario tras el registro.');

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
        purchase_count: 0,
      });

    if (profileError) throw profileError;

    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error al cerrar sesión", description: error.message, variant: "destructive" });
    }
    setUser(null);
  };

  const updateUser = async (updatedData) => {
    if (!user) return;

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        name: updatedData.name,
        phone: updatedData.phone,
        email: updatedData.email,
      },
    });

    if (authUpdateError) {
      toast({ title: "Error actualización auth", description: authUpdateError.message, variant: "destructive" });
      throw authUpdateError;
    }

    const { data: profileUpdateData, error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        name: updatedData.name,
        phone: updatedData.phone,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (profileUpdateError) {
      toast({ title: "Error actualización perfil", description: profileUpdateError.message, variant: "destructive" });
      throw profileUpdateError;
    }

    setUser(prev => ({ ...prev, ...profileUpdateData }));
  };

  const sendPasswordResetEmail = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      register,
      updateUser,
      loading: loading || !triedSession,
      sendPasswordResetEmail,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
