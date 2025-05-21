module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    // Desactivar la regla de imágenes sin atributo alt en archivos específicos
    'jsx-a11y/alt-text': 'error', // Mantener como error por defecto
    
    // Desactivar la regla de variables no utilizadas en archivos específicos
    '@typescript-eslint/no-unused-vars': 'error', // Mantener como error por defecto
  },
  overrides: [
    // Desactivar específicamente las reglas para el archivo GraficoPolizas.tsx
    {
      files: ['src/components/Dashboard/UI/GraficoPolizas.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      }
    },
    // Desactivar la regla de atributo alt para InformeValoracionPDF.tsx
    {
      files: ['src/components/Valoraciones/InformeValoracionPDF.tsx'],
      rules: {
        'jsx-a11y/alt-text': 'off',
      }
    },
    // Desactivar las variables no utilizadas para VistaDetalleValoracion.tsx
    {
      files: ['src/components/Valoraciones/VistaDetalleValoracion.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@next/next/no-img-element': 'off',
      }
    },
  ]
}; 