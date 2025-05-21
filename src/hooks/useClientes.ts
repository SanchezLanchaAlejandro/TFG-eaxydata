import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabaseData } from './useSupabaseData';
import supabase from '@/lib/supabase';

// Tipo para los clientes basado en la estructura de la base de datos
export type ClienteDB = {
  id: string;
  workshop_id: string;
  nombre: string;
  apellido: string;
  nif_cif: string;
  razon_social: string | null;
  direccion: string | null;
  email: string | null;
  telefono: string | null;
  fecha_creacion: string;
};

// Tipo para los clientes con formato para la interfaz
export type ClienteUI = {
  id: string;
  nombre: string;
  apellidos: string;
  razonSocial: string | null;
  cif: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  fechaAlta: string;
  activo: boolean;
  vehiculos: VehiculoUI[];
};

// Tipo para crear un cliente nuevo
export type NuevoClienteData = Omit<ClienteUI, 'id' | 'fechaAlta' | 'activo' | 'vehiculos'>;

// Tipo para los vehículos
export type VehiculoDB = {
  cliente_id: string;
  marca: string;
  modelo: string;
  matricula: string;
  bastidor: string;
};

export type VehiculoUI = {
  id: string;
  matricula: string;
  bastidor: string;
  marca: string;
  modelo: string;
};

export function useClientes() {
  const { userProfile, hasRole, loading: userLoading } = useSupabaseData();
  const [clientes, setClientes] = useState<ClienteUI[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Referencias para control de recargas
  const isFetching = useRef(false);
  const lastWorkshopId = useRef<string | null>(null);
  
  // Convertir clientes de la base de datos al formato de la interfaz
  const mapClienteDBToUI = useCallback((clienteDB: ClienteDB): ClienteUI => {
    return {
      id: clienteDB.id,
      nombre: clienteDB.nombre,
      apellidos: clienteDB.apellido,
      razonSocial: clienteDB.razon_social,
      cif: clienteDB.nif_cif,
      direccion: clienteDB.direccion,
      telefono: clienteDB.telefono,
      email: clienteDB.email,
      fechaAlta: clienteDB.fecha_creacion,
      activo: true, // Por defecto asumimos que están activos
      vehiculos: [], // Por ahora no cargamos vehículos
    };
  }, []);
  
  // Cargar listado de clientes
  const fetchClientes = useCallback(async (forceRefresh = false) => {
    // No hacemos nada si ya estamos cargando
    if (isFetching.current && !forceRefresh) return;
    
    // Verificar que el usuario es GESTOR_TALLER
    if (!hasRole('GESTOR_TALLER') || !userProfile?.workshop_id) {
      setClientes([]);
      setLoading(false);
      return;
    }
    
    // Evitar recargas innecesarias si el workshop_id no ha cambiado
    if (!forceRefresh && lastWorkshopId.current === userProfile.workshop_id) {
      return;
    }
    
    try {
      isFetching.current = true;
      setLoading(true);
      setError(null);
      
      // Actualizar la referencia del workshop_id
      lastWorkshopId.current = userProfile.workshop_id;
      
      // Consultar clientes asociados al workshop_id del usuario
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('workshop_id', userProfile.workshop_id);
      
      if (error) {
        throw error;
      }
      
      // Transformar los datos al formato de UI
      const clientesUI = (data || []).map(mapClienteDBToUI);
      setClientes(clientesUI);
      
    } catch (err: unknown) {
      console.error('Error al cargar los clientes:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los clientes');
    } finally {
      setLoading(false);
      setIsInitialized(true);
      isFetching.current = false;
    }
  }, [hasRole, userProfile?.workshop_id, mapClienteDBToUI]);

  // Función para obtener un cliente específico con sus vehículos
  const obtenerClientePorId = async (clienteId: string) => {
    if (!hasRole('GESTOR_TALLER') || !userProfile?.workshop_id) {
      setError('No tienes permisos para consultar clientes');
      return { success: false, error: 'No tienes permisos para consultar clientes' };
    }

    try {
      setLoading(true);
      setError(null);

      // Consultar el cliente por su ID
      const { data: clienteDB, error: errorCliente } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .eq('workshop_id', userProfile.workshop_id)
        .single();

      if (errorCliente) {
        throw errorCliente;
      }

      if (!clienteDB) {
        throw new Error('Cliente no encontrado');
      }

      // Convertir el cliente a formato UI
      const clienteUI = mapClienteDBToUI(clienteDB);

      // Consultar vehículos del cliente
      const { data: vehiculosDB, error: errorVehiculos } = await supabase
        .from('vehiculos')
        .select('*')
        .eq('cliente_id', clienteId);

      if (errorVehiculos) {
        throw errorVehiculos;
      }

      // Convertir vehículos al formato UI y asignarlos al cliente
      clienteUI.vehiculos = (vehiculosDB || []).map(vehiculoDB => ({
        id: vehiculoDB.id,
        matricula: vehiculoDB.matricula,
        bastidor: vehiculoDB.bastidor,
        marca: vehiculoDB.marca,
        modelo: vehiculoDB.modelo
      }));

      return { success: true, cliente: clienteUI };
    } catch (err: unknown) {
      console.error('Error al obtener el cliente:', err);
      setError(err instanceof Error ? err.message : 'Error al obtener el cliente');
      return { success: false, error: err instanceof Error ? err.message : 'Error al obtener el cliente' };
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar un cliente existente
  const actualizarCliente = async (clienteId: string, datosCliente: Omit<ClienteUI, 'id' | 'fechaAlta' | 'vehiculos'>, vehiculos: VehiculoUI[] = []) => {
    // Verificar que el usuario es GESTOR_TALLER
    if (!hasRole('GESTOR_TALLER') || !userProfile?.workshop_id) {
      setError('No tienes permisos para actualizar clientes');
      return { success: false, error: 'No tienes permisos para actualizar clientes' };
    }

    try {
      setLoading(true);
      setError(null);

      // Preparar datos para actualizar en la base de datos
      const clienteDB = {
        nombre: datosCliente.nombre,
        apellido: datosCliente.apellidos,
        nif_cif: datosCliente.cif,
        razon_social: datosCliente.razonSocial,
        direccion: datosCliente.direccion,
        email: datosCliente.email,
        telefono: datosCliente.telefono
      };

      // Actualizar el cliente en la base de datos
      const { data: clienteActualizado, error: errorActualizarCliente } = await supabase
        .from('clientes')
        .update(clienteDB)
        .eq('id', clienteId)
        .eq('workshop_id', userProfile.workshop_id)
        .select('*')
        .single();

      if (errorActualizarCliente) {
        throw errorActualizarCliente;
      }

      if (!clienteActualizado) {
        throw new Error('No se pudo actualizar el cliente');
      }

      // Obtener los vehículos actuales del cliente
      const { data: vehiculosActuales, error: errorVehiculosActuales } = await supabase
        .from('vehiculos')
        .select('*')
        .eq('cliente_id', clienteId);

      if (errorVehiculosActuales) {
        throw errorVehiculosActuales;
      }

      // Mapear IDs de vehículos actuales y nuevos para su comparación
      const idsVehiculosActuales = vehiculosActuales ? vehiculosActuales.map(v => v.id) : [];
      const idsVehiculosNuevos = vehiculos.filter(v => v.id && v.id.length > 0).map(v => v.id);

      // 1. Eliminar vehículos que ya no están presentes
      const idsParaEliminar = idsVehiculosActuales.filter(id => !idsVehiculosNuevos.includes(id));
      if (idsParaEliminar.length > 0) {
        const { error: errorEliminarVehiculos } = await supabase
          .from('vehiculos')
          .delete()
          .in('id', idsParaEliminar);
          
        if (errorEliminarVehiculos) {
          console.error('Error al eliminar vehículos:', errorEliminarVehiculos);
          // Continuamos con la operación, no es crítico
        }
      }

      // 2. Actualizar o insertar nuevos vehículos
      for (const vehiculo of vehiculos) {
        const vehiculoDB = {
          cliente_id: clienteId,
          matricula: vehiculo.matricula,
          bastidor: vehiculo.bastidor,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo
        };

        if (vehiculo.id && vehiculo.id.length > 0) {
          // Actualizar un vehículo existente
          const { error: errorActualizarVehiculo } = await supabase
            .from('vehiculos')
            .update(vehiculoDB)
            .eq('id', vehiculo.id)
            .eq('cliente_id', clienteId);

          if (errorActualizarVehiculo) {
            console.error('Error al actualizar vehículo:', errorActualizarVehiculo);
            // Continuamos con la operación, no es crítico
          }
        } else {
          // Crear un nuevo vehículo
          const { error: errorInsertarVehiculo } = await supabase
            .from('vehiculos')
            .insert(vehiculoDB);

          if (errorInsertarVehiculo) {
            console.error('Error al insertar vehículo:', errorInsertarVehiculo);
            // Continuamos con la operación, no es crítico
          }
        }
      }

      // 3. Recargar la lista de clientes para reflejar los cambios
      fetchClientes(true);

      return { success: true };
    } catch (err: unknown) {
      console.error('Error al actualizar el cliente:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar el cliente');
      return { success: false, error: err instanceof Error ? err.message : 'Error al actualizar el cliente' };
    } finally {
      setLoading(false);
    }
  };

  // Función para crear un nuevo cliente
  const crearCliente = async (nuevoCliente: NuevoClienteData, vehiculos: VehiculoUI[] = []) => {
    // Verificar que el usuario es GESTOR_TALLER
    if (!hasRole('GESTOR_TALLER') || !userProfile?.workshop_id) {
      setError('No tienes permisos para crear clientes');
      return { success: false, error: 'No tienes permisos para crear clientes' };
    }

    try {
      setLoading(true);
      setError(null);

      // Preparar datos para insertar en la base de datos
      const clienteDB = {
        workshop_id: userProfile.workshop_id,
        nombre: nuevoCliente.nombre,
        apellido: nuevoCliente.apellidos,
        nif_cif: nuevoCliente.cif,
        razon_social: nuevoCliente.razonSocial,
        direccion: nuevoCliente.direccion,
        email: nuevoCliente.email,
        telefono: nuevoCliente.telefono,
        fecha_creacion: new Date().toISOString()
      };

      // Insertar el nuevo cliente
      const { data: clienteCreado, error: errorCrearCliente } = await supabase
        .from('clientes')
        .insert(clienteDB)
        .select('*')
        .single();

      if (errorCrearCliente) {
        throw errorCrearCliente;
      }

      if (!clienteCreado) {
        throw new Error('No se pudo crear el cliente');
      }

      // Insertar vehículos del cliente si hay alguno
      for (const vehiculo of vehiculos) {
        await crearVehiculo({
          cliente_id: clienteCreado.id,
          matricula: vehiculo.matricula,
          bastidor: vehiculo.bastidor,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo
        });
      }

      // Recargar la lista de clientes para incluir el nuevo
      fetchClientes(true);

      return { success: true, clienteId: clienteCreado.id };
    } catch (err: unknown) {
      console.error('Error al crear el cliente:', err);
      setError(err instanceof Error ? err.message : 'Error al crear el cliente');
      return { success: false, error: err instanceof Error ? err.message : 'Error al crear el cliente' };
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para crear un vehículo
  const crearVehiculo = async (vehiculo: VehiculoDB) => {
    const { error } = await supabase
      .from('vehiculos')
      .insert(vehiculo);

    if (error) {
      console.error('Error al crear vehículo:', error);
      // Esta función es auxiliar, no propagamos el error
    }
  };

  // Función para eliminar un cliente
  const eliminarCliente = async (clienteId: string) => {
    // Verificar que el usuario es GESTOR_TALLER
    if (!hasRole('GESTOR_TALLER') || !userProfile?.workshop_id) {
      setError('No tienes permisos para eliminar clientes');
      return { success: false, error: 'No tienes permisos para eliminar clientes' };
    }

    try {
      setLoading(true);
      setError(null);

      // Primero eliminar todos los vehículos del cliente
      const { error: errorEliminarVehiculos } = await supabase
        .from('vehiculos')
        .delete()
        .eq('cliente_id', clienteId);

      if (errorEliminarVehiculos) {
        throw errorEliminarVehiculos;
      }

      // Luego eliminar el cliente
      const { error: errorEliminarCliente } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteId)
        .eq('workshop_id', userProfile.workshop_id);

      if (errorEliminarCliente) {
        throw errorEliminarCliente;
      }

      // Recargar la lista para reflejar la eliminación
      fetchClientes(true);

      return { success: true };
    } catch (err: unknown) {
      console.error('Error al eliminar el cliente:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar el cliente');
      return { success: false, error: err instanceof Error ? err.message : 'Error al eliminar el cliente' };
    } finally {
      setLoading(false);
    }
  };

  // Cargar clientes cuando el perfil del usuario esté disponible
  useEffect(() => {
    if (!userLoading && userProfile && hasRole('GESTOR_TALLER')) {
      fetchClientes();
    }
  }, [userProfile, userLoading, fetchClientes, hasRole]);

  return {
    clientes,
    loading,
    error,
    isInitialized,
    obtenerClientePorId,
    actualizarCliente,
    crearCliente,
    eliminarCliente,
    recargarClientes: () => fetchClientes(true)
  };
} 