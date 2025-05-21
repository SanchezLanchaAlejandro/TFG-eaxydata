import { useState, useEffect } from 'react';
import { Cliente, Vehiculo } from './types';
import { useClientes } from '@/hooks/useClientes';
import { toast } from 'react-hot-toast';
import { 
  UserIcon, 
  IdentificationIcon, 
  AtSymbolIcon, 
  PhoneIcon, 
  BuildingOfficeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

interface EdicionClienteProps {
  cliente: Cliente;
  onClienteActualizado: (cliente: Cliente) => void;
  onCancelar: () => void;
}

interface VehiculoFormData {
  matricula: string;
  bastidor: string;
  marca: string;
  modelo: string;
}

export const EdicionCliente = ({ cliente, onClienteActualizado, onCancelar }: EdicionClienteProps) => {
  const { actualizarCliente } = useClientes();
  const [formData, setFormData] = useState<Omit<Cliente, 'id' | 'fechaAlta' | 'vehiculos'>>({
    nombre: cliente.nombre,
    apellidos: cliente.apellidos || '',
    razonSocial: cliente.razonSocial || '',
    cif: cliente.cif,
    direccion: cliente.direccion,
    telefono: cliente.telefono,
    email: cliente.email,
    activo: cliente.activo
  });
  
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>(cliente.vehiculos || []);
  const [nuevoVehiculo, setNuevoVehiculo] = useState<VehiculoFormData>({
    matricula: '',
    bastidor: '',
    marca: '',
    modelo: '',
  });
  const [mostrarFormVehiculo, setMostrarFormVehiculo] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [erroresVehiculo, setErroresVehiculo] = useState<Record<string, string>>({});
  const [procesando, setProcesando] = useState(false);
  
  // Actualizar el formulario si el cliente cambia externamente
  useEffect(() => {
    setFormData({
      nombre: cliente.nombre,
      apellidos: cliente.apellidos || '',
      razonSocial: cliente.razonSocial || '',
      cif: cliente.cif,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      email: cliente.email,
      activo: cliente.activo
    });
    setVehiculos(cliente.vehiculos || []);
  }, [cliente]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Para el campo de teléfono, solo permitir números y limitar a 9 dígitos
    if (name === 'telefono') {
      const numerosFiltrados = value.replace(/\D/g, '').slice(0, 9);
      setFormData({
        ...formData,
        [name]: numerosFiltrados || null // Permitir null si está vacío
      });
    } else {
      setFormData({
        ...formData,
        [name]: value || null // Permitir null si está vacío
      });
    }
    
    // Limpiar el error del campo que se está editando
    if (errores[name]) {
      setErrores({
        ...errores,
        [name]: ''
      });
    }
  };
  
  const handleVehiculoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setNuevoVehiculo({
      ...nuevoVehiculo,
      [name]: value
    });
    
    // Limpiar el error del campo que se está editando
    if (erroresVehiculo[name]) {
      setErroresVehiculo({
        ...erroresVehiculo,
        [name]: ''
      });
    }
  };
  
  // Función para manejar eventos de teclas en el campo teléfono
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const telefono = input.value.replace(/\D/g, '');
    
    // Permitir teclas de navegación (flechas, inicio, fin, tab, etc.) y teclas de edición (backspace, delete)
    const teclasPemitidas = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'];
    
    // Si ya hay 9 dígitos y no es una tecla permitida y no está seleccionando texto
    if (
      telefono.length >= 9 && 
      !teclasPemitidas.includes(e.key) && 
      !(e.ctrlKey || e.metaKey) && 
      input.selectionEnd !== input.selectionStart &&
      /^\d$/.test(e.key)
    ) {
      e.preventDefault();
    }
  };
  
  // Función para manejar pegado (paste) en el campo teléfono
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const currentValue = e.currentTarget.value.replace(/\D/g, '');
    
    // Si ya hay 9 dígitos, prevenir el pegado
    if (currentValue.length >= 9) {
      e.preventDefault();
      return;
    }
    
    // Si el pegado excedería los 9 dígitos, interceptar y recortar
    const clipboardData = e.clipboardData.getData('text');
    const onlyNumbers = clipboardData.replace(/\D/g, '');
    
    const remainingSpace = 9 - currentValue.length;
    if (onlyNumbers.length > remainingSpace) {
      e.preventDefault();
      
      // Obtener la selección actual
      const input = e.currentTarget;
      const selectionStart = input.selectionStart || 0;
      const selectionEnd = input.selectionEnd || 0;
      
      // Calcular el nuevo valor
      const beforeSelection = currentValue.substring(0, selectionStart);
      const afterSelection = currentValue.substring(selectionEnd);
      const newValue = beforeSelection + onlyNumbers.slice(0, remainingSpace) + afterSelection;
      
      // Actualizar el valor
      setFormData({
        ...formData,
        telefono: newValue.slice(0, 9)
      });
    }
  };
  
  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};
    
    if (!formData.nombre || typeof formData.nombre !== 'string' || !formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }
    
    if (!formData.cif || typeof formData.cif !== 'string' || !formData.cif.trim()) {
      nuevosErrores.cif = 'El NIE/NIF/CIF es obligatorio';
    }
    
    if (!formData.direccion || typeof formData.direccion !== 'string' || !formData.direccion.trim()) {
      nuevosErrores.direccion = 'El domicilio es obligatorio';
    }
    
    const telefonoString = typeof formData.telefono === 'string' ? formData.telefono : String(formData.telefono || '');
    
    if (!telefonoString || !telefonoString.trim()) {
      nuevosErrores.telefono = 'El teléfono es obligatorio';
    } else if (!/^\d{9}$/.test(telefonoString)) {
      nuevosErrores.telefono = 'El teléfono debe tener 9 dígitos';
    }
    
    if (!formData.email || typeof formData.email !== 'string' || !formData.email.trim()) {
      nuevosErrores.email = 'El correo electrónico es obligatorio';
    } else if (typeof formData.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nuevosErrores.email = 'El formato del correo electrónico no es válido';
    }
    
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };
  
  const validarFormularioVehiculo = (): boolean => {
    const nuevosErrores: Record<string, string> = {};
    
    if (!nuevoVehiculo.matricula || typeof nuevoVehiculo.matricula !== 'string' || !nuevoVehiculo.matricula.trim()) {
      nuevosErrores.matricula = 'La matrícula es obligatoria';
    }
    
    if (!nuevoVehiculo.bastidor || typeof nuevoVehiculo.bastidor !== 'string' || !nuevoVehiculo.bastidor.trim()) {
      nuevosErrores.bastidor = 'El bastidor es obligatorio';
    }
    
    if (!nuevoVehiculo.marca || typeof nuevoVehiculo.marca !== 'string' || !nuevoVehiculo.marca.trim()) {
      nuevosErrores.marca = 'La marca es obligatoria';
    }
    
    if (!nuevoVehiculo.modelo || typeof nuevoVehiculo.modelo !== 'string' || !nuevoVehiculo.modelo.trim()) {
      nuevosErrores.modelo = 'El modelo es obligatorio';
    }
    
    setErroresVehiculo(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };
  
  const handleAgregarVehiculo = () => {
    if (validarFormularioVehiculo()) {
      const vehiculoNuevo: Vehiculo = {
        ...nuevoVehiculo,
        id: Date.now().toString()
      };
      
      setVehiculos([...vehiculos, vehiculoNuevo]);
      
      // Limpiar el formulario
      setNuevoVehiculo({
        matricula: '',
        bastidor: '',
        marca: '',
        modelo: '',
      });
      
      setMostrarFormVehiculo(false);
    }
  };
  
  const handleEliminarVehiculo = (id: string) => {
    setVehiculos(vehiculos.filter(v => v.id !== id));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validarFormulario()) {
      try {
        setProcesando(true);
        
        // Preparar los datos a enviar
        const datosActualizados = {
          nombre: formData.nombre,
          apellidos: formData.apellidos || '',
          razonSocial: formData.razonSocial,
          cif: formData.cif,
          direccion: formData.direccion,
          telefono: formData.telefono,
          email: formData.email,
          activo: cliente.activo
        };
        
        // Actualizar el cliente en la base de datos
        const resultado = await actualizarCliente(
          cliente.id,
          datosActualizados,
          vehiculos
        );
        
        if (resultado.success) {
          // Actualizar el cliente local
          const clienteActualizado: Cliente = {
            ...cliente,
            nombre: formData.nombre,
            apellidos: formData.apellidos || '',
            razonSocial: formData.razonSocial,
            cif: formData.cif,
            direccion: formData.direccion,
            telefono: formData.telefono,
            email: formData.email,
            vehiculos: vehiculos,
          };
          
          onClienteActualizado(clienteActualizado);
          toast.success('Cliente actualizado correctamente');
        } else {
          toast.error(resultado.error || 'Error al actualizar el cliente');
        }
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Error al actualizar el cliente');
      } finally {
        setProcesando(false);
      }
    }
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Editar Cliente</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Datos del cliente
          </h3>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center relative rounded-md shadow-sm">
                <div className="absolute left-0 pl-3 z-10 pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Nombre"
                  className={`w-full pl-10 pr-3 py-2 border ${
                    errores.nombre ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white h-10`}
                />
                {errores.nombre && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errores.nombre}</p>
                )}
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Apellidos
              </label>
              <div className="flex items-center relative rounded-md shadow-sm">
                <div className="absolute left-0 pl-3 z-10 pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="apellidos"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  placeholder="Apellidos"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white h-10"
                />
              </div>
            </div>
            
            <div className="sm:col-span-6">
              <label htmlFor="razonSocial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Razón o denominación social
              </label>
              <div className="flex items-center relative rounded-md shadow-sm">
                <div className="absolute left-0 pl-3 z-10 pointer-events-none">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="razonSocial"
                  name="razonSocial"
                  value={formData.razonSocial ?? ''}
                  onChange={handleChange}
                  placeholder="Servicios Mecánicos S.L."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white h-10"
                />
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="cif" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                NIE / NIF / CIF <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center relative rounded-md shadow-sm">
                <div className="absolute left-0 pl-3 z-10 pointer-events-none">
                  <IdentificationIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="cif"
                  name="cif"
                  value={formData.cif}
                  onChange={handleChange}
                  placeholder="B12345678"
                  className={`w-full pl-10 pr-3 py-2 border ${
                    errores.cif ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white h-10`}
                />
                {errores.cif && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errores.cif}</p>
                )}
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center relative rounded-md shadow-sm">
                <div className="absolute left-0 pl-3 z-10 pointer-events-none">
                  <PhoneIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono ?? ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="612345678"
                  maxLength={9}
                  pattern="[0-9]{9}"
                  inputMode="numeric"
                  className={`w-full pl-10 pr-3 py-2 border ${
                    errores.telefono ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white h-10`}
                />
                {errores.telefono && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errores.telefono}</p>
                )}
              </div>
            </div>
            
            <div className="sm:col-span-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center relative rounded-md shadow-sm">
                <div className="absolute left-0 pl-3 z-10 pointer-events-none">
                  <AtSymbolIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email ?? ''}
                  onChange={handleChange}
                  placeholder="ejemplo@correo.com"
                  className={`w-full pl-10 pr-3 py-2 border ${
                    errores.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white h-10`}
                />
                {errores.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errores.email}</p>
                )}
              </div>
            </div>
            
            <div className="sm:col-span-6">
              <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Domicilio <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <textarea
                  id="direccion"
                  name="direccion"
                  rows={3}
                  value={formData.direccion ?? ''}
                  onChange={handleChange}
                  placeholder="Calle, número, código postal, localidad, provincia"
                  className={`w-full pl-10 pr-3 py-2 border ${
                    errores.direccion ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white`}
                />
                {errores.direccion && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errores.direccion}</p>
                )}
              </div>
            </div>
            
            <div className="sm:col-span-6">
              <div className="flex items-center">
                <input
                  id="activo"
                  name="activo"
                  type="checkbox"
                  checked={formData.activo}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700"
                />
                <label htmlFor="activo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Cliente activo
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Vehículos del cliente
          </h3>
          
          {vehiculos.length > 0 && (
            <div className="mb-6 overflow-hidden bg-white dark:bg-slate-800 shadow-sm rounded-md border border-gray-200 dark:border-gray-700">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {vehiculos.map((vehiculo) => (
                  <li key={vehiculo.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <p className="font-medium text-blue-600 dark:text-blue-400 sm:mr-4 mb-1 sm:mb-0">
                          {vehiculo.matricula}
                        </p>
                        <div className="text-sm text-gray-600 dark:text-gray-300 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            {vehiculo.marca}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            {vehiculo.modelo}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Bastidor: {vehiculo.bastidor}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEliminarVehiculo(vehiculo.id)}
                        className="inline-flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {mostrarFormVehiculo ? (
            <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Nuevo vehículo
              </h4>
              
              <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-4 mb-4">
                <div>
                  <label htmlFor="matricula" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Matrícula <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="matricula"
                      name="matricula"
                      value={nuevoVehiculo.matricula}
                      onChange={handleVehiculoChange}
                      placeholder="1234ABC"
                      className={`block w-full rounded-md ${
                        erroresVehiculo.matricula ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                      } shadow-sm dark:bg-slate-700 dark:text-white sm:text-sm`}
                    />
                    {erroresVehiculo.matricula && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{erroresVehiculo.matricula}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="bastidor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bastidor <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="bastidor"
                      name="bastidor"
                      value={nuevoVehiculo.bastidor}
                      onChange={handleVehiculoChange}
                      placeholder="VF1AB123456789101"
                      className={`block w-full rounded-md ${
                        erroresVehiculo.bastidor ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                      } shadow-sm dark:bg-slate-700 dark:text-white sm:text-sm`}
                    />
                    {erroresVehiculo.bastidor && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{erroresVehiculo.bastidor}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="marca" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Marca <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="marca"
                      name="marca"
                      value={nuevoVehiculo.marca}
                      onChange={handleVehiculoChange}
                      placeholder="Renault"
                      className={`block w-full rounded-md ${
                        erroresVehiculo.marca ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                      } shadow-sm dark:bg-slate-700 dark:text-white sm:text-sm`}
                    />
                    {erroresVehiculo.marca && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{erroresVehiculo.marca}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="modelo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Modelo <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="modelo"
                      name="modelo"
                      value={nuevoVehiculo.modelo}
                      onChange={handleVehiculoChange}
                      placeholder="Clio"
                      className={`block w-full rounded-md ${
                        erroresVehiculo.modelo ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                      } shadow-sm dark:bg-slate-700 dark:text-white sm:text-sm`}
                    />
                    {erroresVehiculo.modelo && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{erroresVehiculo.modelo}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setMostrarFormVehiculo(false)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAgregarVehiculo}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Añadir vehículo
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMostrarFormVehiculo(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Añadir vehículo
            </button>
          )}
        </div>
        
        <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={procesando}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={procesando}
          >
            {procesando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}; 