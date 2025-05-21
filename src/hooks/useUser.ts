import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Session } from '@supabase/supabase-js';
import supabase from '@/lib/supabase';

type AuthError = {
  message: string;
};

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Obtener el usuario actual al iniciar
    async function getInitialUser() {
      try {
        setLoading(true);
        // Obtener la sesión actual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error al obtener la sesión:', error);
          return;
        }
        
        setSession(session);
        setUser(session?.user || null);
        
      } catch (error) {
        console.error('Error al inicializar el usuario:', error);
      } finally {
        setLoading(false);
      }
    }

    getInitialUser();

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // Limpiar la suscripción al desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Función para iniciar sesión
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email, 
        password
      });

      if (error) {
        throw error;
      }

      setUser(data.user);
      setSession(data.session);
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      return { 
        success: false, 
        error: authError.message || 'Error al iniciar sesión'
      };
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      setSession(null);
      router.push('/login');
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      return { 
        success: false, 
        error: authError.message || 'Error al cerrar sesión'
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    login,
    logout
  };
} 