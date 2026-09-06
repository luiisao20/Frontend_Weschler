import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const targetUrl = mode === 'production' ? env.VITE_API_URL_PROD : env.VITE_API_URL_DEV;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      proxy: {
        '/api-chat': {
          target: targetUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-chat/, '')
        }
      }
    }
  };
});
