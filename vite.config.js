import fs from 'fs';
import path, { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function subsitePlugin() {
  return {
    name: 'subsite-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0];
        if (url === '/arcade') req.url = '/pages/arcade/index.html';
        else if (url === '/neworleans') req.url = '/pages/neworleans/index.html';
        else if (url === '/neworleans-tours' || url === '/neworleans/tours') req.url = '/pages/neworleans/tours.html';
        else if (url === '/flights') req.url = '/pages/flights/index.html';
        else if (url === '/tmobile') req.url = '/pages/tmobile/index.html';
        else if (url === '/matrix') req.url = '/pages/matrix/index.html';
        else if (url === '/matrix-arcade' || url === '/matrix/arcade') req.url = '/pages/matrix/arcade.html';
        else if (url === '/opus5ios') req.url = '/pages/opus5ios/index.html';
        else if (url === '/opus5ios-arcade' || url === '/opus5ios/arcade') req.url = '/pages/opus5ios/arcade.html';
        else if (url === '/opus-max-mac') req.url = '/pages/opus-max-mac/index.html';
        else if (url === '/opus-max-mac-arcade' || url === '/opus-max-mac/arcade') req.url = '/pages/opus-max-mac/arcade.html';
        else if (url === '/codex') req.url = '/pages/codex/index.html';
        next();
      });
    },
    closeBundle() {
      const subsiteAssets = [
        { src: 'pages/neworleans/assets', dest: 'dist/pages/neworleans/assets' },
        { src: 'pages/opus5ios/assets', dest: 'dist/pages/opus5ios/assets' },
        { src: 'pages/opus-max-mac/assets', dest: 'dist/pages/opus-max-mac/assets' },
      ];
      for (const { src, dest } of subsiteAssets) {
        copyDirSync(path.resolve(__dirname, src), path.resolve(__dirname, dest));
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), subsitePlugin()],
  build: {
    outDir: './dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        arcade: resolve(__dirname, 'pages/arcade/index.html'),
        neworleans: resolve(__dirname, 'pages/neworleans/index.html'),
        neworleansTours: resolve(__dirname, 'pages/neworleans/tours.html'),
        flights: resolve(__dirname, 'pages/flights/index.html'),
        tmobile: resolve(__dirname, 'pages/tmobile/index.html'),
        matrix: resolve(__dirname, 'pages/matrix/index.html'),
        matrixArcade: resolve(__dirname, 'pages/matrix/arcade.html'),
        opus5ios: resolve(__dirname, 'pages/opus5ios/index.html'),
        opus5iosArcade: resolve(__dirname, 'pages/opus5ios/arcade.html'),
        opusMaxMac: resolve(__dirname, 'pages/opus-max-mac/index.html'),
        opusMaxMacArcade: resolve(__dirname, 'pages/opus-max-mac/arcade.html'),
        codex: resolve(__dirname, 'pages/codex/index.html'),
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
