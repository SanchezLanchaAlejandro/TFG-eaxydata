"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { useSupabaseData, UserProfile, UserRole } from '@/hooks/useSupabaseData';
import { 
  Squares2X2Icon, 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  UsersIcon, 
  XMarkIcon, 
  Bars3Icon,
  ChartBarIcon,
  Cog6ToothIcon,
  BuildingOffice2Icon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import supabase from '@/lib/supabase';

interface SidebarProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactElement;
  showForRoles?: UserRole[];
}

// Función para obtener un nombre amigable para el rol
const getRoleName = (role: UserRole | null | undefined): string => {
  if (!role) return '';
  
  switch(role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'GESTOR_RED':
      return 'Admin Group';
    case 'GESTOR_TALLER':
      return 'User Group';
    default:
      return role;
  }
};

// Componentes memorizados para evitar renders innecesarios
const NavItemSkeleton = React.memo(() => (
  <div className="flex items-center space-x-2 py-2.5 px-4">
    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
    <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
  </div>
));
NavItemSkeleton.displayName = 'NavItemSkeleton';

// Componente para cada elemento de navegación
const NavItem = React.memo(({ item, isActive }: { item: NavigationItem; isActive: boolean }) => (
  <Link
    href={item.href}
    className={`${
      isActive
        ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
    } flex items-center space-x-2 py-2.5 px-4 rounded-md transition-colors duration-200`}
  >
    {item.icon}
    <span>{item.name}</span>
  </Link>
));
NavItem.displayName = 'NavItem';

// Logo del sidebar memorizado
const NetworkLogo = React.memo(({ logo, userLoading }: { logo?: string | null; userLoading: boolean }) => {
  if (userLoading) return null;
  
  return (
    <div className="flex-shrink-0 flex items-center justify-center px-4 mb-5">
      {logo ? (
        <div className="bg-white p-3 rounded-lg shadow-md">
          <img 
            src={logo} 
            alt="Logo de la red" 
            className="h-12 w-auto"
          />
        </div>
      ) : (
        <div className="bg-white p-3 rounded-lg shadow-md">
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">Eaxy Data</span>
        </div>
      )}
    </div>
  );
});
NetworkLogo.displayName = 'NetworkLogo';

// Información del usuario memorizada
const UserInfo = React.memo(({ userProfile, userLoading }: { 
  userProfile: UserProfile | null; 
  userLoading: boolean 
}) => (
  <div className="flex items-center">
    <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full h-10 w-10 flex items-center justify-center">
      <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
        {userProfile?.nombre ? userProfile.nombre.charAt(0).toUpperCase() : '?'}
      </span>
    </div>
    <div className="ml-3">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {userLoading ? (
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        ) : (
          userProfile?.nombre || 'Usuario CST'
        )}
      </div>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {userLoading ? (
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
        ) : (
          getRoleName(userProfile?.role)
        )}
      </div>
    </div>
  </div>
));
UserInfo.displayName = 'UserInfo';

function SidebarComponent({ children }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useUser();
  const { userProfile, loading: userLoading } = useSupabaseData();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isChangingNetwork, setIsChangingNetwork] = useState(false);
  
  // Referencia para rastrear si el componente está montado
  const isMounted = useRef(true);
  // Referencia para controlar los cambios de visibilidad
  const isVisible = useRef(true);
  const lastVisibilityChange = useRef(Date.now());

  // Efecto para controlar la visibilidad del documento
  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now();
      
      // Prevenir múltiples ejecuciones en poco tiempo
      if (now - lastVisibilityChange.current < 1000) {
        return;
      }
      
      lastVisibilityChange.current = now;
      isVisible.current = document.visibilityState === 'visible';
      
      // No realizar operaciones costosas si el documento no es visible
      if (!isVisible.current || !isMounted.current) {
        return;
      }
      
      // Cuando la pestaña vuelve a ser visible después de mucho tiempo,
      // permitimos al usuario interactuar con la interfaz sin recargas automáticas
      // para evitar recargas innecesarias y problemas de rendimiento
    };
    
    // Agregar el event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Limpiar en el desmontaje
    return () => {
      isMounted.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Elementos fijos que siempre se muestran independientemente del rol (memorizados)
  const fixedNavigation = useMemo(() => [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: (
        <div className="bg-indigo-500 p-2 rounded-full">
          <Squares2X2Icon className="h-5 w-5 text-white" />
        </div>
      )
    },
    { 
      name: 'Valoraciones', 
      href: '/valoraciones', 
      icon: (
        <div className="bg-blue-500 p-2 rounded-full">
          <DocumentTextIcon className="h-5 w-5 text-white" />
        </div>
      )
    },
    { 
      name: 'Facturación', 
      href: '/facturacion', 
      icon: (
        <div className="bg-green-500 p-2 rounded-full">
          <CurrencyDollarIcon className="h-5 w-5 text-white" />
        </div>
      )
    },
    { 
      name: 'Indicadores', 
      href: '/indicadores', 
      icon: (
        <div className="bg-purple-500 p-2 rounded-full">
          <ChartBarIcon className="h-5 w-5 text-white" />
        </div>
      )
    },
    { 
      name: 'Configuración', 
      href: '/configuracion', 
      icon: (
        <div className="bg-gray-500 p-2 rounded-full">
          <Cog6ToothIcon className="h-5 w-5 text-white" />
        </div>
      )
    }
  ], []);

  // Elementos de navegación condicionados por rol (memorizados)
  const roleBasedNavigation = useMemo(() => [
    { 
      name: 'Clientes', 
      href: '/clientes',
      showForRoles: ['GESTOR_TALLER'] as UserRole[],
      icon: (
        <div className="bg-amber-500 p-2 rounded-full">
          <UsersIcon className="h-5 w-5 text-white" />
        </div>
      )
    }
  ], []);

  // Combinamos los elementos fijos con los elementos basados en roles (memorizado)
  const navigation = useMemo<NavigationItem[]>(() => [
    ...fixedNavigation,
    ...(userLoading ? [] : roleBasedNavigation)
  ], [fixedNavigation, roleBasedNavigation, userLoading]);

  // Filtrar elementos de navegación según el rol del usuario (memorizado)
  const filteredNavigation = useMemo<NavigationItem[]>(() => {
    if (userProfile?.role && !userLoading) {
      return navigation.filter(item => {
        // Si no hay showForRoles definido, mostrar para todos los roles
        if (!item.showForRoles) return true;
        
        // Si hay showForRoles, verificar si el rol del usuario está incluido
        return item.showForRoles.includes(userProfile.role as UserRole);
      });
    }
    return fixedNavigation; // Mientras carga, solo mostrar elementos fijos
  }, [navigation, userProfile?.role, userLoading, fixedNavigation]);

  // Funciones de manejo de eventos (memorizadas)
  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      
      // Usar el hook useUser para cerrar sesión en Supabase
      await logout();
      
      // Para compatibilidad con modo de desarrollo/demostración, eliminar datos del localStorage
      localStorage.removeItem('user');
    } catch (error: unknown) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout]);

  // Nueva función para manejar el cambio de red (memorizada)
  const handleChangeNetwork = useCallback(async () => {
    // Evitar operaciones si el componente no está montado o visible
    if (!isMounted.current || !isVisible.current || !userProfile) return;
    
    try {
      setIsChangingNetwork(true);
      
      // Actualizar el usuario para quitar el network_id
      const { error } = await supabase
        .from('users')
        .update({ network_id: null })
        .eq('id', userProfile.id);
        
      if (error) {
        console.error('Error al actualizar el perfil:', error);
        return;
      }
      
      // Refrescar la sesión para asegurar que los datos se actualicen
      await supabase.auth.refreshSession();
      
      // Solo redirigir si el componente sigue montado y visible
      if (isMounted.current && isVisible.current) {
        // Redirigir al selector de redes
        window.location.href = '/select-network';
      }
    } catch (error) {
      console.error('Error al cambiar de red:', error);
    } finally {
      if (isMounted.current) {
        setIsChangingNetwork(false);
      }
    }
  }, [userProfile]);

  // Manejadores para abrir/cerrar el sidebar (memorizados)
  const handleOpenSidebar = useCallback(() => setSidebarOpen(true), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);

  // Renderizar elementos de navegación (memorizado)
  const renderNavItems = useMemo(() => {
    if (userLoading) {
      return Array(5).fill(0).map((_, index) => (
        <NavItemSkeleton key={index} />
      ));
    }
    
    return filteredNavigation.map(item => (
      <NavItem 
        key={item.name} 
        item={item} 
        isActive={pathname === item.href} 
      />
    ));
  }, [filteredNavigation, pathname, userLoading]);

  // Renderizar el botón de cambio de red si es necesario (memorizado)
  const changeNetworkButton = useMemo(() => {
    if (userProfile?.role === 'SUPER_ADMIN' && userProfile?.network_id !== null && userProfile?.network_id !== undefined) {
      return (
        <button 
          className="flex items-center space-x-2 py-2 px-3 w-full text-white bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-md"
          onClick={handleChangeNetwork}
          disabled={isChangingNetwork}
        >
          <BuildingOffice2Icon className="h-5 w-5" />
          <span>{isChangingNetwork ? 'Cambiando...' : 'Cambiar de Red'}</span>
        </button>
      );
    }
    return null;
  }, [userProfile?.role, userProfile?.network_id, handleChangeNetwork, isChangingNetwork]);

  return (
    <div className="h-full flex bg-gray-50 dark:bg-slate-900">
      {/* Sidebar para móvil */}
      <div 
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } fixed inset-0 flex z-40 md:hidden`}
      >
        <div
          className="fixed inset-0 bg-gray-800 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 backdrop-blur-sm transition-opacity"
          onClick={handleCloseSidebar}
        ></div>
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-800 shadow-xl transition-transform duration-300">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={handleCloseSidebar}
            >
              <span className="sr-only">Cerrar sidebar</span>
              <div className="flex-shrink-0 bg-red-500 rounded-full p-2">
                <XMarkIcon className="h-5 w-5 text-white" />
              </div>
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <NetworkLogo logo={userProfile?.network_logo} userLoading={userLoading} />
            <nav className="mt-6 px-2 space-y-1">
              {renderNavItems}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex-shrink-0 w-full">
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {userLoading ? (
                    <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    <div>
                      {userProfile?.nombre || 'Usuario CST'}
                      {userProfile?.role && (
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Rol: {getRoleName(userProfile.role)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  {userProfile?.role === 'SUPER_ADMIN' && (
                    <button 
                      className="flex items-center space-x-2 py-2 px-3 w-full text-white bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-md"
                      onClick={handleChangeNetwork}
                      disabled={isChangingNetwork}
                    >
                      <BuildingOffice2Icon className="h-5 w-5" />
                      <span>{isChangingNetwork ? 'Cambiando...' : 'Cambiar de Red'}</span>
                    </button>
                  )}
                  <div className="mt-2">
                    <button 
                      className="flex items-center space-x-2 py-2 px-3 w-full text-white bg-red-600 hover:bg-red-700 transition-colors rounded-md"
                      onClick={handleLogout}
                      disabled={isLoggingOut || userLoading}
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar para escritorio */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <NetworkLogo logo={userProfile?.network_logo} userLoading={userLoading} />
              <nav className="mt-6 flex-1 px-2 space-y-1">
                {renderNavItems}
              </nav>
            </div>
            <div className="flex-shrink-0 flex flex-col border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex-shrink-0 w-full group">
                <UserInfo userProfile={userProfile} userLoading={userLoading} />
              </div>

              <div className="mt-6">
                {changeNetworkButton}
                
                <div className="mt-2">
                  <button 
                    className="flex items-center space-x-2 py-2 px-3 w-full text-white bg-red-600 hover:bg-red-700 transition-colors rounded-md"
                    onClick={handleLogout}
                    disabled={isLoggingOut || userLoading}
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col w-0 flex-1 overflow-auto">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white dark:bg-slate-800 shadow-sm z-10">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={handleOpenSidebar}
          >
            <span className="sr-only">Abrir sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <main className="flex-1 relative focus:outline-none overflow-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Exportar el componente memorizado
export default React.memo(SidebarComponent); 