import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      '__APP_VERSION__': JSON.stringify('1.0.0'),
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, '.'),
      }
    },
    envPrefix: 'VITE_'  // This ensures VITE_ prefixed variables are loaded
  };
});