export type EstadoValoracion = 'pendiente' | 'en_curso' | 'finalizado';
export type EstadoBD = 'Pendiente' | 'En curso' | 'Finalizado';

export interface Valoracion {
  id: string;
  matricula: string;
  chasis: string;
  motorizacion: string;
  tipoPoliza: string;
  aseguradora: string;
  fechaPrimeraMatriculacion: string;
  fotos: string[];
  estado: EstadoValoracion;
  esSiniestroTotal?: boolean;
  fecha_creacion: string;
  fecha_ult_act?: string;
  fecha_finalizado?: string;
  workshop_id?: string | number;
  valorador_id?: string | null;
}

export interface ColumnaKanban {
  id: EstadoValoracion;
  titulo: string;
  valoraciones: Valoracion[];
} 