import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: './dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        arcade: resolve(__dirname, 'arcade.html'),
        neworleans: resolve(__dirname, 'neworleans.html'),
        flights: resolve(__dirname, 'flights.html'),
        tmobile: resolve(__dirname, 'tmobile.html'),
        matrix: resolve(__dirname, 'matrix.html'),
        matrixArcade: resolve(__dirname, 'matrix-arcade.html'),
        opus5ios: resolve(__dirname, 'opus5ios.html'),
        opus5iosArcade: resolve(__dirname, 'opus5ios-arcade.html'),
        opusMaxMac: resolve(__dirname, 'opus-max-mac.html'),
        opusMaxMacArcade: resolve(__dirname, 'opus-max-mac-arcade.html'),
      },
    },
  },
  server: {
    headers: {
      'Cache-Control': 'no-store'
    },
    proxy: {
      '/api': {
        target: 'https://alanmarcero.com',
        changeOrigin: true,
      }
    }
  }
});