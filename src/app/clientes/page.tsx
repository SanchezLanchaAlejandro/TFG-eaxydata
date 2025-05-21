"use client";

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';
import { Cliente, FiltroClientes as FiltroClientesType } from '@/components/Clientes/types';
import { AltaCliente } from '@/components/Clientes/AltaCliente';
import { EdicionCliente } from '@/components/Clientes/EdicionCliente';
import { ListadoClientes } from '@/components/Clientes/ListadoClientes';
import { FiltroClientes } from '@/components/Clientes/FiltroClientes';
import { ConsultaCliente } from '@/components/Clientes/ConsultaCliente';
import { ConfirmacionModal } from '@/components/Clientes/ConfirmacionModal';
import { useClientes } from '@/hooks/useClientes';
import { toast } from 'react-hot-toast';

enum ModoVista {
  LISTADO = 'listado',
  DETALLE = 'detalle',
  ALTA = 'alta',
  EDICION = 'edicion',
  CARGANDO = 'cargando'
}

export default function ClientesPage() {
  const { clientes, loading, error, recargarClientes, obtenerClientePorId, eliminarCliente } = useClientes();
  const [clienteActual, setClienteActual] = useState<Cliente | null>(null);
  const [modoVista, setModoVista] = useState<ModoVista>(ModoVista.LISTADO);
  const [filtros, setFiltros] = useState<FiltroClientesType>({
    mostrarInactivos: true
  });
  
  // Estado para la modal de confirmación
  const [modalConfirmacion, setModalConfirmacion] = useState({
    isOpen: false,
    clienteId: '',
    nombreCliente: ''
  });
  
  useEffect(() => {
    // Si hay un error al cargar los clientes, mostrarlo
    if (error) {
      toast.error(`Error: ${error}`);
    }
  }, [error]);
  
  const handleClienteCreado = () => {
    recargarClientes();
    setModoVista(ModoVista.LISTADO);
    toast.success('Cliente creado correctamente');
  };
  
  const handleClienteActualizado = (clienteActualizado: Cliente) => {
    // Recargar la lista de clientes después de la actualización
    recargarClientes();
    
    // Actualizar el cliente actual con los datos más recientes
    setClienteActual(clienteActualizado);
    
    // Cambiar a la vista de detalle para mostrar el cliente actualizado
    setModoVista(ModoVista.DETALLE);
    
    // Mostrar mensaje de éxito
    toast.success('Cliente actualizado correctamente');
  };
  
  // Función para mostrar la modal de confirmación de eliminación
  const handleConfirmarEliminar = (id: string) => {
    // Buscar el cliente para mostrar su nombre en la confirmación
    const clienteEncontrado = clientes.find(c => c.id === id);
    
    if (clienteEncontrado) {
      setModalConfirmacion({
        isOpen: true,
        clienteId: id,
        nombreCliente: `${clienteEncontrado.nombre} ${clienteEncontrado.apellidos}`.trim()
      });
    }
  };
  
  // Función para cancelar la eliminación
  const handleCancelarEliminar = () => {
    setModalConfirmacion({
      isOpen: false,
      clienteId: '',
      nombreCliente: ''
    });
  };
  
  // Función para confirmar y ejecutar la eliminación
  const handleEliminarCliente = async () => {
    try {
      const { clienteId } = modalConfirmacion;
      
      // Cerrar la modal antes de hacer la operación
      setModalConfirmacion({
        isOpen: false,
        clienteId: '',
        nombreCliente: ''
      });
      
      // Mostrar un toast de carga
      const toastId = toast.loading('Eliminando cliente...');
      
      // Ejecutar la eliminación
      const resultado = await eliminarCliente(clienteId);
      
      // Actualizar el toast según el resultado
      if (resultado.success) {
        toast.success('Cliente eliminado correctamente', { id: toastId });
        
        // Si el cliente eliminado era el que estaba en detalle, volver al listado
        if (clienteActual && clienteActual.id === clienteId) {
          setModoVista(ModoVista.LISTADO);
          setClienteActual(null);
        }
        
        // Recargar la lista de clientes
        recargarClientes();
      } else {
        toast.error(resultado.error || 'Error al eliminar el cliente', { id: toastId });
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el cliente');
    }
  };
  
  const handleVerDetalle = async (id: string) => {
    setModoVista(ModoVista.CARGANDO);
    
    try {
      const resultado = await obtenerClientePorId(id);
      
      if (resultado.success && resultado.cliente) {
        setClienteActual(resultado.cliente);
        setModoVista(ModoVista.DETALLE);
      } else {
        toast.error(resultado.error || 'Error al obtener los datos del cliente');
        setModoVista(ModoVista.LISTADO);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al obtener los datos del cliente');
      setModoVista(ModoVista.LISTADO);
    }
  };
  
  const handleEditarCliente = async (id: string) => {
    setModoVista(ModoVista.CARGANDO);
    
    try {
      const resultado = await obtenerClientePorId(id);
      
      if (resultado.success && resultado.cliente) {
        setClienteActual(resultado.cliente);
        setModoVista(ModoVista.EDICION);
      } else {
        toast.error(resultado.error || 'Error al obtener los datos del cliente');
        setModoVista(ModoVista.LISTADO);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al obtener los datos del cliente');
      setModoVista(ModoVista.LISTADO);
    }
  };
  
  const renderContenido = () => {
    switch (modoVista) {
      case ModoVista.CARGANDO:
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 dark:text-gray-300">Cargando datos del cliente...</p>
            </div>
          </div>
        );
        
      case ModoVista.DETALLE:
        if (!clienteActual) return null;
        return (
          <ConsultaCliente
            cliente={clienteActual}
            onEditar={() => handleEditarCliente(clienteActual.id)}
            onVolver={() => setModoVista(ModoVista.LISTADO)}
          />
        );
      
      case ModoVista.ALTA:
        return (
          <AltaCliente
            onClienteCreado={handleClienteCreado}
            onCancelar={() => setModoVista(ModoVista.LISTADO)}
          />
        );
      
      case ModoVista.EDICION:
        if (!clienteActual) return null;
        return (
          <EdicionCliente
            cliente={clienteActual}
            onClienteActualizado={handleClienteActualizado}
            onCancelar={() => setModoVista(clienteActual ? ModoVista.DETALLE : ModoVista.LISTADO)}
          />
        );
      
      case ModoVista.LISTADO:
      default:
        return (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Clientes</h1>
              <button
                onClick={() => setModoVista(ModoVista.ALTA)}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Nuevo Cliente
              </button>
            </div>
            
            <FiltroClientes
              filtros={filtros}
              onFiltrosChange={setFiltros}
            />
            
            {loading ? (
              <div className="text-center py-10">
                <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600 dark:text-gray-300">Cargando clientes...</p>
              </div>
            ) : (
              <ListadoClientes
                onVerDetalle={handleVerDetalle}
                onEditarCliente={handleEditarCliente}
                onEliminarCliente={handleConfirmarEliminar}
                filtros={filtros}
              />
            )}
          </>
        );
    }
  };
  
  return (
    <Sidebar>
      <div className="min-h-screen">
        {renderContenido()}
        
        {/* Modal de confirmación de eliminación */}
        <ConfirmacionModal
          isOpen={modalConfirmacion.isOpen}
          title="Eliminar cliente"
          message={`¿Estás seguro de que deseas eliminar al cliente ${modalConfirmacion.nombreCliente}? Esta acción no se puede deshacer y eliminará todos los vehículos asociados.`}
          confirmButtonText="Eliminar"
          cancelButtonText="Cancelar"
          onConfirm={handleEliminarCliente}
          onCancel={handleCancelarEliminar}
        />
      </div>
    </Sidebar>
  );
} 