"use client";

import SelectorNetworks from "@/components/shared/SelectorNetworks";
import { useUser } from "@/hooks/useUser";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SelectNetworkPage() {
  const { user, loading: authLoading } = useUser();
  const { userProfile, loading: profileLoading } = useSupabaseData();
  const router = useRouter();

  useEffect(() => {
    // Si el usuario no está cargando y no está autenticado, redirigir al login
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Si el perfil está cargado
    if (!profileLoading && userProfile) {
      // Si no es SUPER_ADMIN, enviar al dashboard
      if (userProfile.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
        return;
      }

      // Si es SUPER_ADMIN pero ya tiene network_id asignado, enviar al dashboard
      if (userProfile.role === 'SUPER_ADMIN' && userProfile.network_id) {
        router.push('/dashboard');
      }
    }
  }, [user, userProfile, authLoading, profileLoading, router]);

  // Mientras está cargando, mostrar spinner
  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verificando usuario...</p>
        </div>
      </div>
    );
  }

  // Si el usuario está autenticado y es SUPER_ADMIN sin network_id, mostrar el selector
  if (user && userProfile?.role === 'SUPER_ADMIN' && !userProfile?.network_id) {
    return (
      <div className="h-full overflow-auto">
        <SelectorNetworks />
      </div>
    );
  }

  // Estado de carga por defecto
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Redirigiendo...</p>
      </div>
    </div>
  );
} 