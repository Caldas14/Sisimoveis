import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'stream', 'util', 'events']
    })
  ],
  define: {
    'process.env': {},
    'global': {},
    'Buffer': ['buffer', 'Buffer']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'react-hook-form']
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    },
    port: 3000,
    host: 'localhost'
  },
  resolve: {
    alias: {
      process: path.resolve('node_modules/process/browser.js'),
      buffer: path.resolve('node_modules/buffer/'),
      util: path.resolve('node_modules/util/')
    }
  }
});