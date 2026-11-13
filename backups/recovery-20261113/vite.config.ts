import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'motion',
        'react-helmet-async',
        'i18next',
        'react-i18next',
        'i18next-http-backend',
        'lucide-react',
        'react-dropzone',
      ],
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: false,
      ws: false,
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
      legalComments: 'none',
    },
    worker: {
      format: 'es',
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('preload-helper') || id.includes('commonjsHelpers')) return 'vendor-react';
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'vendor-react';
            if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) return 'vendor-i18n';
            if (id.includes('node_modules/firebase')) return 'vendor-firebase';
            if (id.includes('node_modules/pdfjs-dist')) return 'vendor-pdfjs';
            if (id.includes('node_modules/pdf-lib')) return 'vendor-pdf-lib';
            if (id.includes('node_modules/jspdf')) return 'vendor-jspdf';
            if (id.includes('node_modules/pptxgenjs')) return 'vendor-pptxgenjs';
            if (id.includes('node_modules/tesseract.js')) return 'vendor-tesseract';
            if (id.includes('node_modules/xlsx') || id.includes('node_modules/exceljs')) return 'vendor-spreadsheets';
            if (id.includes('node_modules/docx') || id.includes('node_modules/mammoth')) return 'vendor-docx';
            if (id.includes('node_modules/jszip')) return 'vendor-zip';
          },
        },
      },
    },
  };
});


