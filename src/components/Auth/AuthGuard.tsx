"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useSupabaseData, UserRole } from '@/hooks/useSupabaseData';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, loading: authLoading } = useUser();
  const { userProfile, loading: profileLoading, hasRole } = useSupabaseData();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const router = useRouter();
  
  const loading = authLoading || profileLoading;

  useEffect(() => {
    const checkAuth = async () => {
      // Si el usuario no está autenticado y hemos terminado de cargar
      if (!authLoading && !user) {
        router.push('/login');
        return;
      }

      // Si no hay usuario o seguimos cargando la autenticación, no hacemos nada más
      if (!user || authLoading) return;

      // Si se requiere un rol específico, verificar usando la función hasRole
      if (requiredRole && !profileLoading && userProfile) {
        if (!hasRole(requiredRole)) {
          router.push('/dashboard');
          return;
        }
        
        setIsAuthorized(true);
      } else if (!requiredRole) {
        // Si no se requiere un rol específico, el usuario está autorizado
        setIsAuthorized(true);
      }
    };

    checkAuth();
  }, [user, authLoading, profileLoading, userProfile, router, requiredRole, hasRole]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  // Solo mostrar los children si el usuario está autorizado
  return isAuthorized ? <>{children}</> : null;
} 