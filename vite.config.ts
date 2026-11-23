import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const ALLOWED_VITE_HOSTS: string[] = Array.from(
  new Set([
    'localhost',
    '127.0.0.1',
    '::1',
    'pdfsun.in',
    'www.pdfsun.in',
    '.pdfsun.in',
    'ais-dev-nc2omqrcrewclthjpyezu6-513767419820.asia-east1.run.app',
    'ais-pre-nc2omqrcrewclthjpyezu6-513767419820.asia-east1.run.app',
    ...[process.env.APP_URL, ...(process.env.ALLOWED_ORIGINS || '').split(',')]
      .map((raw) => (raw || '').trim())
      .filter(Boolean)
      .map((raw) => {
        try {
          return new URL(raw).hostname.toLowerCase();
        } catch {
          return raw.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].toLowerCase();
        }
      })
      .filter(Boolean),
  ])
);

export default defineConfig(() => {
  return {
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
        react: path.resolve(process.cwd(), './node_modules/react'),
        'react-dom': path.resolve(process.cwd(), './node_modules/react-dom'),
        'react-dom/client': path.resolve(process.cwd(), './node_modules/react-dom/client'),
        'react/jsx-runtime': path.resolve(process.cwd(), './node_modules/react/jsx-runtime'),
        'react/jsx-dev-runtime': path.resolve(process.cwd(), './node_modules/react/jsx-dev-runtime'),
        'react-is': path.resolve(process.cwd(), './node_modules/react-is'),
      },
      dedupe: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-is',
      ],
    },
    optimizeDeps: {
      noDiscovery: true,
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-is',
        'motion',
        'motion/react',
        'react-helmet-async',
        'i18next',
        'i18next-http-backend',
        'lucide-react',
        'react-dropzone',
        'react-easy-crop',
        'recharts',
        'd3',
        '@simplewebauthn/browser',
        'canvas-confetti',
        'qrcode',
        'jsqr',
        'firebase/app',
        'firebase/auth',
        'firebase/database',
        'firebase/firestore',
        'docx',
        'exceljs',
        'mammoth',
        'pptxgenjs',
        'jspdf',
        'jszip',
        'pako',
        'pdf-lib',
        'pdfjs-dist',
        'pdfjs-dist/legacy/build/pdf.mjs',
        'tesseract.js',
        'xlsx',
        '@pdfsmaller/pdf-decrypt',
        '@pdfsmaller/pdf-encrypt',
      ],
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: ALLOWED_VITE_HOSTS,
      hmr: false,
      ws: false,
    },
    worker: {
      format: 'es',
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('preload-helper') || id.includes('commonjsHelpers')) return 'vendor-react';
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'vendor-react';
            if (id.includes('node_modules/i18next')) return 'vendor-i18n';
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


