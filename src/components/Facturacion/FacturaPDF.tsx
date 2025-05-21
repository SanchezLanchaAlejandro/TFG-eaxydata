import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFDownloadLink,
  Font,
  Image
} from '@react-pdf/renderer';

// Definición de tipos
interface ItemFactura {
  id: string;
  tipo: string;
  descripcion: string;
  precio_uni: number;
  cantidad: number;
  descuento: number;
  iva: number;
  importe_total: number;
}

interface ClienteFactura {
  id: string;
  nombre: string;
  apellido: string;
  razon_social: string | null;
  nif_cif: string;
  direccion: string | null;
  email: string | null;
  telefono: string | null;
}

interface TallerFactura {
  id: string;
  nombre_comercial: string;
  razon_social: string | null;
  cif_nif: string | null;
  direccion: string | null;
  codigo_postal: string | null;
  ciudad: string | null;
  provincia: string | null;
  email_taller: string | null;
  telefono_movil: string | null;
}

interface FacturaData {
  id: string;
  numero_factura: string;
  fecha_emision: string;
  concepto: string;
  metodo_pago: string;
  observaciones?: string;
  base_imponible: number;
  iva_total: number;
  total_factura: number;
  estado_cobro?: boolean;
}

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logo: {
    width: 150,
    height: 50,
  },
  facturaInfo: {
    textAlign: 'right',
    fontSize: 12,
  },
  facturaNumero: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoBox: {
    width: '48%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 5,
    fontSize: 10,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoRow: {
    marginBottom: 3,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 'bold',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    padding: 5,
    fontSize: 9,
  },
  tableColTipo: {
    width: '15%',
  },
  tableColDesc: {
    width: '35%',
  },
  tableColCantidad: {
    width: '10%',
    textAlign: 'center',
  },
  tableColPrecio: {
    width: '10%',
    textAlign: 'right',
  },
  tableColDescuento: {
    width: '10%',
    textAlign: 'right',
  },
  tableColIva: {
    width: '10%',
    textAlign: 'right',
  },
  tableColTotal: {
    width: '10%',
    textAlign: 'right',
  },
  totales: {
    marginLeft: 'auto',
    width: '30%',
    marginBottom: 30,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    fontSize: 10,
  },
  totalLabel: {
    textAlign: 'left',
  },
  totalValue: {
    textAlign: 'right',
  },
  totalFactura: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 5,
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
  },
  observaciones: {
    marginTop: 15,
    fontSize: 9,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  metodosPago: {
    marginTop: 10,
    fontSize: 9,
  },
});

// Componente principal para generar el PDF
const FacturaPDF: React.FC<{
  factura: FacturaData;
  cliente: ClienteFactura;
  taller: TallerFactura;
  items: ItemFactura[];
}> = ({ factura, cliente, taller, items }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  const calcularImporteConDescuento = (item: ItemFactura) => {
    return item.precio_uni * item.cantidad * (1 - item.descuento / 100);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabecera con logo y datos de factura */}
        <View style={styles.header}>
          <View>
            <Text style={styles.infoTitle}>{taller.nombre_comercial || taller.razon_social}</Text>
          </View>
          <View style={styles.facturaInfo}>
            <Text style={styles.facturaNumero}>FACTURA #{factura.numero_factura}</Text>
            <Text>Fecha: {formatDate(factura.fecha_emision)}</Text>
          </View>
        </View>

        {/* Información de Cliente y Taller */}
        <View style={styles.infoContainer}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>DATOS DEL TALLER</Text>
            <Text style={styles.infoRow}>{taller.razon_social || taller.nombre_comercial}</Text>
            <Text style={styles.infoRow}>CIF/NIF: {taller.cif_nif || '-'}</Text>
            <Text style={styles.infoRow}>{taller.direccion || '-'}</Text>
            <Text style={styles.infoRow}>
              {taller.codigo_postal} {taller.ciudad}, {taller.provincia}
            </Text>
            <Text style={styles.infoRow}>Tel: {taller.telefono_movil || '-'}</Text>
            <Text style={styles.infoRow}>{taller.email_taller || '-'}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>CLIENTE</Text>
            <Text style={styles.infoRow}>
              {cliente.razon_social || `${cliente.nombre} ${cliente.apellido}`}
            </Text>
            <Text style={styles.infoRow}>CIF/NIF: {cliente.nif_cif || '-'}</Text>
            <Text style={styles.infoRow}>{cliente.direccion || '-'}</Text>
            <Text style={styles.infoRow}>Tel: {cliente.telefono || '-'}</Text>
            <Text style={styles.infoRow}>{cliente.email || '-'}</Text>
          </View>
        </View>

        {/* Tabla de Conceptos */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableColTipo}>TIPO</Text>
            <Text style={styles.tableColDesc}>DESCRIPCIÓN</Text>
            <Text style={styles.tableColCantidad}>CANT.</Text>
            <Text style={styles.tableColPrecio}>PRECIO</Text>
            <Text style={styles.tableColDescuento}>DESC. %</Text>
            <Text style={styles.tableColIva}>IVA %</Text>
            <Text style={styles.tableColTotal}>TOTAL</Text>
          </View>

          {items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.tableColTipo}>{item.tipo}</Text>
              <Text style={styles.tableColDesc}>{item.descripcion}</Text>
              <Text style={styles.tableColCantidad}>{item.cantidad}</Text>
              <Text style={styles.tableColPrecio}>{formatCurrency(item.precio_uni)}</Text>
              <Text style={styles.tableColDescuento}>{item.descuento}%</Text>
              <Text style={styles.tableColIva}>{item.iva}%</Text>
              <Text style={styles.tableColTotal}>
                {formatCurrency(item.importe_total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totales}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Base Imponible:</Text>
            <Text style={styles.totalValue}>{formatCurrency(factura.base_imponible)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA:</Text>
            <Text style={styles.totalValue}>{formatCurrency(factura.iva_total)}</Text>
          </View>
          <View style={styles.totalFactura}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalValue}>{formatCurrency(factura.total_factura)}</Text>
          </View>
        </View>

        {/* Forma de Pago */}
        <View style={styles.metodosPago}>
          <Text style={styles.infoTitle}>FORMA DE PAGO</Text>
          <Text>{factura.metodo_pago}</Text>
        </View>

        {/* Observaciones */}
        {factura.observaciones && (
          <View style={styles.observaciones}>
            <Text style={styles.infoTitle}>OBSERVACIONES</Text>
            <Text>{factura.observaciones}</Text>
          </View>
        )}

        {/* Pie de página */}
        <View style={styles.footer}>
          <Text>
            Factura generada por sistema Eaxy Data. {formatDate(factura.fecha_emision)}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Componente para descargar el PDF
export const FacturaPDFDownload: React.FC<{
  factura: FacturaData;
  cliente: ClienteFactura;
  taller: TallerFactura;
  items: ItemFactura[];
  fileName?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ factura, cliente, taller, items, fileName, className, children }) => {
  return (
    <PDFDownloadLink
      document={<FacturaPDF factura={factura} cliente={cliente} taller={taller} items={items} />}
      fileName={fileName || `Factura-${factura.numero_factura}.pdf`}
      className={className}
    >
      {({ blob, url, loading, error }) => (loading ? 'Generando PDF...' : children)}
    </PDFDownloadLink>
  );
};

export default FacturaPDF; 