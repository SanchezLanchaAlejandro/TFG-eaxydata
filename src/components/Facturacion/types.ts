// Interfaz para facturas
export interface Factura {
  id: string;
  cliente: string;
  clienteId?: string;
  concepto: string;
  importe: number;
  fechaEmision: string;
  metodoPago?: string;
  observaciones?: string;
  irpf?: number;
  numeroCuenta?: string;
  // Campos opcionales para cálculos
  baseImponible?: number;
  totalIva?: number;
  totalIrpf?: number;
  totalFactura?: number;
  // Campo para facturas adjuntadas
  tipo?: 'generada' | 'adjuntada';
  archivo?: File;
  // Estado de cobro
  estadoCobro?: boolean;
}

// Interfaz para los items de factura
export interface ItemFactura {
  id: string;
  tipo: 'Mano de Obra' | 'Pieza' | 'Pintura' | 'Otro';
  descripcion: string;
  precioUnitario: number;
  cantidad: number;
  descuento: number;
  iva: number;
}

// Filtros para facturas
export interface FiltrosFactura {
  cliente: string;
  concepto: string;
  fechaDesde: string;
  fechaHasta: string;
}

// Estado de facturación
export interface EstadoFacturacion {
  facturas: Factura[];
  filtros: FiltrosFactura;
} 