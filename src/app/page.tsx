"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useSupabaseData } from '@/hooks/useSupabaseData';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const { userProfile, loading: profileLoading } = useSupabaseData();

  useEffect(() => {
    // Función para manejar la redirección
    const handleRedirection = () => {
      console.log('Estado de la redirección:', {
        authLoading,
        profileLoading,
        user: !!user,
        userProfile: userProfile ? {
          role: userProfile.role,
          networkId: !!userProfile.network_id
        } : null
      });

      if (authLoading || profileLoading) {
        return; // Esperar a que carguen los datos
      }

      if (!user) {
        // Si no hay usuario, redirigir al login
        console.log('Redirigiendo a /login - No hay usuario');
        router.push('/login');
        return;
      }

      if (userProfile) {
        // Si es SUPER_ADMIN sin network_id, redirigir al selector
        if (userProfile.role === 'SUPER_ADMIN' && !userProfile.network_id) {
          console.log('Redirigiendo a /select-network - SUPER_ADMIN sin network_id');
          router.push('/select-network');
          return;
        }

        // En todos los demás casos, redirigir al dashboard
        console.log('Redirigiendo a /dashboard - Usuario con network_id o no SUPER_ADMIN');
        router.push('/dashboard');
        return;
      }
    };

    handleRedirection();
  }, [router, user, userProfile, authLoading, profileLoading]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Cargando...</p>
      </div>
    </div>
  );
} 