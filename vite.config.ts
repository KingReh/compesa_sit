import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // O único arquivo acima de 500 KB é o de exportação (jsPDF + SheetJS),
      // baixado apenas quando o usuário exporta um relatório.
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // Bibliotecas em arquivos próprios: mudam raramente, então o navegador
          // (e o service worker) reaproveitam o cache entre versões do sistema.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
            if (id.includes('@supabase')) return 'vendor-supabase';
            // Ícones num único arquivo (só os usados entram), em vez de dezenas de mini-requisições.
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (/[\\/]node_modules[\\/](leaflet|react-leaflet|@react-leaflet)[\\/]/.test(id)) return 'vendor-leaflet';
            if (/[\\/]node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'vendor-motion';
            return undefined;
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
