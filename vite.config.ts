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
      hmr: process.env.DISABLE_HMR === 'true' ? false : { overlay: false },
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
      legalComments: 'none',
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/pdfjs-dist')) return 'vendor-pdfjs';
            if (id.includes('node_modules/pptxgenjs')) return 'vendor-pptxgenjs';
            if (id.includes('node_modules/tesseract.js')) return 'vendor-tesseract';
            if (id.includes('node_modules/jspdf') || id.includes('node_modules/pdf-lib')) return 'vendor-pdf-engines';
            if (id.includes('node_modules/xlsx') || id.includes('node_modules/exceljs')) return 'vendor-spreadsheets';
          },
        },
      },
    },
  };
});


