import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        setLoading(false);
        return;
      }
      
      if (session) {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116: no rows found
          console.error("Error fetching user profile:", profileError);
        }
        setUser(userProfile ? { ...session.user, ...userProfile } : session.user);
      }
      setLoading(false);
    };

    getSession();

    const { data: authSubscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching user profile on auth change:", profileError);
        }
        setUser(userProfile ? { ...session.user, ...userProfile } : session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      if (authSubscription && typeof authSubscription.unsubscribe === 'function') {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const login = async (credentials) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    if (error) {
      throw error;
    }
    if (data.user) {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        setUser(userProfile ? { ...data.user, ...userProfile } : data.user);
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
    if (error) {
      throw error;
    }
    // Si el usuario fue creado, insertamos en "profiles"
  if (data.user) {
    const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: data.user.id,
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      purchase_count: 0,
      });

      if (profileError) throw profileError;
    }
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

    const { data: authUpdateData, error: authUpdateError } = await supabase.auth.updateUser({
        data: { name: updatedData.name, phone: updatedData.phone , email: updatedData.email} 
    });
    
    if (authUpdateError) {
        toast({ title: "Error al actualizar datos de autenticación", description: authUpdateError.message, variant: "destructive"});
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
        toast({ title: "Error al actualizar perfil", description: profileUpdateError.message, variant: "destructive"});
        throw profileUpdateError;
    }
    
    if (profileUpdateData) {
      setUser(prevUser => ({ ...prevUser, ...profileUpdateData }));
    } else {
      setUser(prevUser => ({ ...prevUser, name: updatedData.name, phone: updatedData.phone }));
    }
  };

  const sendPasswordResetEmail = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      throw error;
    }
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw error;
    }
  };


  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateUser, loading, sendPasswordResetEmail, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);