import React from 'react';
import { useClientes } from '@/hooks/useClientes';
import { Cliente, FiltroClientes } from './types';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface ListadoClientesProps {
  onVerDetalle: (id: string) => void;
  onEditarCliente: (id: string) => void;
  onEliminarCliente: (id: string) => void;
  filtros?: FiltroClientes;
  clientesPrecargados?: Cliente[]; // Opcional para permitir datos precargados
}

export const ListadoClientes = ({ 
  onVerDetalle,
  onEditarCliente,
  onEliminarCliente,
  filtros = {},
  clientesPrecargados
}: ListadoClientesProps) => {
  const { clientes: clientesHook, loading, error } = useClientes();
  
  // Usar clientes precargados si se proporcionan, de lo contrario usar los del hook
  const todosLosClientes = clientesPrecargados || clientesHook;
  
  // Filtrar clientes según los criterios
  const clientesFiltrados = todosLosClientes.filter(cliente => {
    // Si mostrarInactivos es false y el cliente está inactivo, filtrarlo
    if (filtros.mostrarInactivos === false && !cliente.activo) {
      return false;
    }
    
    // Filtrar por nombre si se ha especificado
    if (filtros.nombre && !cliente.nombre.toLowerCase().includes(filtros.nombre.toLowerCase()) && 
        !cliente.apellidos.toLowerCase().includes(filtros.nombre.toLowerCase())) {
      return false;
    }
    
    // Filtrar por CIF/NIF si se ha especificado
    if (filtros.cif && !cliente.cif.toLowerCase().includes(filtros.cif.toLowerCase())) {
      return false;
    }
    
    // Filtrar por email si se ha especificado
    if (filtros.email && cliente.email && typeof cliente.email === 'string' && 
        !cliente.email.toLowerCase().includes(filtros.email.toLowerCase())) {
      return false;
    }
    
    // Filtrar por teléfono si se ha especificado
    if (filtros.telefono && cliente.telefono) {
      // Convertir el teléfono a string para poder hacer la búsqueda independientemente del tipo
      const telefonoStr = String(cliente.telefono);
      if (!telefonoStr.includes(filtros.telefono)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Evitar renderizar si estamos cargando o ya mostramos la carga en el padre
  if (loading && !clientesPrecargados) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">Cargando clientes...</p>
      </div>
    );
  }
  
  // Mostrar error si existe
  if (error && !clientesPrecargados) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 dark:text-red-400">Error al cargar los clientes: {error}</p>
      </div>
    );
  }
  
  // Si no hay clientes, mostrar mensaje
  if (clientesFiltrados.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">No se encontraron clientes con los filtros aplicados</p>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          Recargar datos
        </button>
      </div>
    );
  }
  
  // Vista normal con datos
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Nombre
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                NIE/NIF/CIF
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Teléfono
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
            {clientesFiltrados.map((cliente) => (
              <tr 
                key={cliente.id} 
                className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
                onClick={() => onVerDetalle(cliente.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {cliente.nombre} {cliente.apellidos}
                  {cliente.razonSocial && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {cliente.razonSocial}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {cliente.cif}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {cliente.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {cliente.telefono}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    cliente.activo 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  }`}>
                    <span className={`mr-1.5 h-2 w-2 rounded-full ${
                      cliente.activo 
                        ? 'bg-emerald-500 dark:bg-emerald-400' 
                        : 'bg-red-500 dark:bg-red-400'
                    }`}></span>
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onVerDetalle(cliente.id);
                      }}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Ver detalles"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditarCliente(cliente.id);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title="Editar cliente"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminarCliente(cliente.id);
                      }}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Eliminar cliente"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 