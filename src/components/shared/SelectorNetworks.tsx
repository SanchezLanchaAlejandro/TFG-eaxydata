"use client";

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { motion } from 'framer-motion';

interface Network {
  id: string;
  name: string;
  logo: string;
}

export default function SelectorNetworks() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  
  // Estado para detectar el modo oscuro
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Efecto para detectar el modo oscuro
  useEffect(() => {
    // Verificar preferencia inicial
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = darkModeQuery.matches || document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
    
    // Configurar el observer para detectar cambios en tiempo real
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    // También escuchar cambios en la preferencia del sistema
    const darkModeListener = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    darkModeQuery.addEventListener('change', darkModeListener);
    
    return () => {
      observer.disconnect();
      darkModeQuery.removeEventListener('change', darkModeListener);
    };
  }, []);

  useEffect(() => {
    const fetchNetworks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('networks')
        .select('id, nombre, logo_image');

      if (error) {
        console.error('❌ Error al cargar redes:', error.message);
        setNetworks([]);
      } else {
        setNetworks((data || [])
          .map(network => ({
            id: network.id,
            name: network.nombre,
            logo: network.logo_image
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
        );
      }

      setLoading(false);
    };

    fetchNetworks();
  }, []);

  const handleSelectNetwork = async (networkId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ network_id: networkId })
        .eq('id', user.id);
  
      if (error) {
        console.error('❌ Error al asignar network:', error.message);
        return;
      }
  
      // Refrescar la sesión para asegurar que los datos actualizados estén disponibles
      await supabase.auth.refreshSession();
      
      // Usar window.location.href en lugar de navigate para forzar recarga completa
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error al seleccionar red:', error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Cargando redes...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 p-6 overflow-y-auto">
      {/* Logo de la empresa - mostrar según modo claro/oscuro */}
      <img 
        src={isDarkMode ? "/logo-sinfondo-blanco.png" : "/logo-sinfondo-normal.png"} 
        alt="CST Logo" 
        className="w-48 md:w-56 mb-8" 
      />

      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🔧 Selecciona una Red de Talleres 🔧</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {networks.map((network, index) => (
          <motion.div
            key={network.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            whileHover={{
              y: -10,
              scale: 1.05,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              transition: { type: 'tween', ease: 'easeInOut', duration: 0.2 }
            }}
            className="cursor-pointer bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 flex flex-col justify-between items-center w-full h-50 transition"
            onClick={() => handleSelectNetwork(network.id)}
          >
            <img src={network.logo} alt={network.name} className="w-60 h-32 object-contain" />
            <p className="text-xl font-semibold text-center mt-auto text-gray-800 dark:text-white">{network.name}</p>
        </motion.div>
        ))}
      </div>
    </div>
  );
} 