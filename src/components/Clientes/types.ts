export interface Vehiculo {
  id: string;
  matricula: string;
  bastidor: string;
  marca: string;
  modelo: string;
}

export interface Cliente {
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
  vehiculos: Vehiculo[];
}

export type FiltroClientes = {
  nombre?: string;
  cif?: string;
  email?: string;
  telefono?: string;
  mostrarInactivos?: boolean;
}; 