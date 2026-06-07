import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const hmrPort = Number(process.env.VITE_HMR_PORT) || undefined;
  const hmr = process.env.DISABLE_HMR === 'true'
    ? false
    : hmrPort
      ? { port: hmrPort }
      : true;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: `http://localhost:${process.env.PORT || 3000}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
