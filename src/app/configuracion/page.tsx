"use client";

import { useState } from 'react';
import AuthGuard from '@/components/Auth/AuthGuard';
import Sidebar from '@/components/Dashboard/Sidebar';
import { ModalCambioContraseña } from '@/components/Configuracion/ModalCambioContraseña';
import { ConfiguracionItem } from '@/components/Configuracion/ConfiguracionItem';
import { Cog6ToothIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function Configuracion() {
  const [isModalCambioContraseñaOpen, setIsModalCambioContraseñaOpen] = useState(false);

  return (
    <AuthGuard>
      <Sidebar>
        <div className="space-y-8">
          {/* Encabezado */}
          <div className="flex items-center space-x-3 pb-5 border-b border-gray-200 dark:border-gray-700">
            <Cog6ToothIcon className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">Configuración</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Gestiona tus preferencias y ajustes de cuenta.
              </p>
            </div>
          </div>

          {/* Sección de Perfil y Seguridad */}
          <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-lg">
            <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <LockClosedIcon className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Perfil y Seguridad</h2>
            </div>
            <div className="px-6 divide-y divide-gray-200 dark:divide-gray-700">
              <ConfiguracionItem
                title="Cambiar Contraseña"
                description="Actualiza tu contraseña periódicamente para mayor seguridad"
                onEdit={() => setIsModalCambioContraseñaOpen(true)}
                icon={<LockClosedIcon className="h-5 w-5 text-blue-500" />}
              />
            </div>
          </div>

          {/* Modal para cambiar contraseña */}
          <ModalCambioContraseña
            isOpen={isModalCambioContraseñaOpen}
            onClose={() => setIsModalCambioContraseñaOpen(false)}
          />
        </div>
      </Sidebar>
    </AuthGuard>
  );
} 