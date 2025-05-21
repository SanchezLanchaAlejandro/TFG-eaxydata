import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFDownloadLink,
  Image
} from '@react-pdf/renderer';
import { Valoracion } from './types';

// URL base para las imágenes
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://car-service-tech.netlify.app';

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10
  },
  headerText: {
    flex: 2
  },
  logo: {
    width: 100,
    height: 40,
    objectFit: 'contain'
  },
  title: {
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 5
  },
  subtitle: {
    fontSize: 10,
    color: '#666'
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 800,
    backgroundColor: '#f5f5f5',
    padding: 5,
    marginBottom: 5
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5
  },
  label: {
    fontSize: 10,
    fontWeight: 800,
    width: 120
  },
  value: {
    fontSize: 10,
    flex: 1
  },
  table: {
    marginTop: 10,
    marginBottom: 10
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    paddingBottom: 3,
    paddingTop: 3
  },
  tableHeader: {
    backgroundColor: '#f5f5f5'
  },
  tableCell: {
    fontSize: 9,
    paddingRight: 5,
    flex: 1
  },
  tableCellSmall: {
    fontSize: 9,
    width: 60,
    paddingRight: 5
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10
  },
  observacionesText: {
    fontSize: 10,
    lineHeight: 1.5,
    marginTop: 5
  },
  observacionesTitle: {
    fontSize: 10,
    fontWeight: 800,
    marginBottom: 5
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    fontSize: 8,
    textAlign: 'center',
    color: '#666'
  }
});

// Formatear fechas para PDF (formato español DD/MM/YYYY)
const formatearFecha = (fechaStr: string | undefined): string => {
  // Si no hay fecha, devolver mensaje predeterminado
  if (!fechaStr) return "Fecha no disponible";
  
  try {
    // Intentar convertir la cadena en objeto Date
    const fecha = new Date(fechaStr);
    
    // Verificar si la fecha es válida
    if (isNaN(fecha.getTime())) {
      return "Fecha no válida";
    }
    
    // Formatear la fecha manualmente para evitar problemas de localización
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    
    return `${dia}/${mes}/${año}`;
  } catch {
    return "Error al formatear fecha";
  }
};

// Componente para el documento PDF
const InformePDF = ({ valoracion, informe }: { valoracion: Valoracion, informe: Record<string, string> | string }) => {
  // Función para procesar observaciones, extrayéndolas del contenido HTML
  const procesarObservaciones = () => {
    try {
      // Verificar si el informe es un string (HTML) o un objeto
      if (typeof informe === 'string') {
        // Extraer el contenido entre las etiquetas <h2>Observaciones</h2> y el siguiente <h2> o final
        const regex = /<h2>\s*Observaciones\s*<\/h2>([\s\S]*?)(?=<h2>|$)/i;
        const match = informe.match(regex);
        
        if (match && match[1]) {
          // Eliminar todas las etiquetas HTML y conservar solo el texto
          const textoLimpio = match[1].replace(/<\/?[^>]+(>|$)/g, '').trim();
          
          // Dividir por saltos de línea y filtrar líneas vacías
          const lineas = textoLimpio.split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');
          
          if (lineas.length === 0 || (lineas.length === 1 && lineas[0].includes('observaciones sobre el estado'))) {
            return ['No hay observaciones registradas'];
          }
          
          return lineas;
        }
      } else if (typeof informe === 'object' && informe.observaciones) {
        // Si es un objeto y ya tiene campo 'observaciones'
        if (!informe.observaciones.trim()) {
          return ['No hay observaciones registradas'];
        }
        
        return informe.observaciones.split('\n').filter(linea => linea.trim() !== '');
      }
      
      return ['No hay observaciones registradas'];
    } catch (error) {
      console.error('Error al procesar observaciones:', error);
      return ['Error al procesar observaciones'];
    }
  };

  // Determinar si hay daños registrados
  const hayDaños = typeof informe === 'object' && informe.danos && informe.danos !== 'null' && informe.danos !== '[]';
  
  // Procesar daños si existen
  const danosProcesados = hayDaños ? JSON.parse((informe as Record<string, string>).danos || '[]') : [];
  
  // Obtener la fecha del informe con fallback a fecha actual
  const fechaInforme = formatearFecha(
    typeof informe === 'object' ? 
      (informe.fecha_actualizacion || informe.created_at || new Date().toISOString()) : 
      new Date().toISOString()
  );
  
  // Obtener observaciones procesadas
  const observaciones = procesarObservaciones();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Informe de Valoración - {valoracion.matricula}</Text>
            <Text style={styles.subtitle}>Generado el {fechaInforme}</Text>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image 
            src={`${BASE_URL}/logo-sinfondo-normal.png`}
            style={styles.logo}
            // No se puede usar alt en @react-pdf/renderer
          />
        </View>
        
        {/* Información del vehículo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Vehículo</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Matrícula:</Text>
            <Text style={styles.value}>{valoracion.matricula || 'No disponible'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Número de Chasis:</Text>
            <Text style={styles.value}>{valoracion.chasis || 'No disponible'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Motorización:</Text>
            <Text style={styles.value}>{valoracion.motorizacion || 'No disponible'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Aseguradora:</Text>
            <Text style={styles.value}>{valoracion.aseguradora || 'No disponible'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tipo de Póliza:</Text>
            <Text style={styles.value}>{valoracion.tipoPoliza || 'No disponible'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de Matriculación:</Text>
            <Text style={styles.value}>{formatearFecha(valoracion.fechaPrimeraMatriculacion)}</Text>
          </View>
        </View>
        
        {/* Daños detectados */}
        {hayDaños && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daños Detectados</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCellSmall}>Posición</Text>
                <Text style={styles.tableCell}>Descripción</Text>
                <Text style={styles.tableCellSmall}>Gravedad</Text>
              </View>
              
              {danosProcesados.map((dano: {posicion: string; descripcion: string; gravedad: string}) => (
                <View key={`${dano.posicion}_${dano.descripcion}`} style={styles.tableRow}>
                  <Text style={styles.tableCellSmall}>{dano.posicion}</Text>
                  <Text style={styles.tableCell}>{dano.descripcion}</Text>
                  <Text style={styles.tableCellSmall}>{dano.gravedad}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Observaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observaciones</Text>
          {observaciones.map((obs, index) => (
            <Text key={index} style={styles.observacionesText}>{obs}</Text>
          ))}
        </View>
        
        {/* Pie de página */}
        <View style={styles.footer}>
          <Text>
            Este documento es un informe generado por el sistema de gestión de valoraciones de Car Service Tech.
            No constituye un documento oficial de peritación.
          </Text>
        </View>
        
        {/* Número de página */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} />
      </Page>
    </Document>
  );
};

// Componente para generar el enlace de descarga del PDF
const InformeValoracionPDF = ({ valoracion, informe }: { valoracion: Valoracion, informe: Record<string, string> | string }) => {
  return (
    <PDFDownloadLink
      document={<InformePDF valoracion={valoracion} informe={informe} />}
      fileName={`valoracion_${valoracion.matricula}.pdf`}
      className="flex items-center px-3 py-1.5 text-sm rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30 transition-colors"
    >
      {({ loading }) => (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {loading ? 'Generando PDF...' : 'Descargar PDF'}
        </>
      )}
    </PDFDownloadLink>
  );
};

// Exportamos tanto el componente por defecto como una exportación con nombre para compatibilidad
export const InformeValoracionPDFDownload = InformeValoracionPDF;
export default InformeValoracionPDF; 