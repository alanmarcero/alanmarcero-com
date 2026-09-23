import fs from 'fs';
import path, { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Clean URL → subsite HTML entry, mirroring the CloudFront clean-URL rewrite so
// the dev server answers the same paths production does.
const DEV_ROUTES = {
  '/arcade': '/pages/arcade/index.html',
  '/neworleans': '/pages/neworleans/index.html',
  '/neworleans-tours': '/pages/neworleans/tours.html',
  '/neworleans/tours': '/pages/neworleans/tours.html',
  '/flights': '/pages/flights/index.html',
  '/tmobile': '/pages/tmobile/index.html',
  '/stocks': '/pages/stocks/index.html',
  '/matrix': '/pages/matrix/index.html',
  '/matrix-arcade': '/pages/matrix/arcade.html',
  '/matrix/arcade': '/pages/matrix/arcade.html',
  '/opus5ios': '/pages/opus5ios/index.html',
  '/opus5ios-arcade': '/pages/opus5ios/arcade.html',
  '/opus5ios/arcade': '/pages/opus5ios/arcade.html',
  '/opus-max-mac': '/pages/opus-max-mac/index.html',
  '/opus-max-mac-arcade': '/pages/opus-max-mac/arcade.html',
  '/opus-max-mac/arcade': '/pages/opus-max-mac/arcade.html',
  '/codex': '/pages/codex/index.html',
};

// Subsite asset folders that live outside public/, so Vite does not copy them.
const SUBSITE_ASSET_DIRS = [
  'pages/neworleans/assets',
  'pages/opus5ios/assets',
  'pages/opus-max-mac/assets',
];

function subsitePlugin() {
  return {
    name: 'subsite-plugin',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const route = DEV_ROUTES[req.url.split('?')[0]];
        if (route) req.url = route;
        next();
      });
    },
    closeBundle() {
      for (const dir of SUBSITE_ASSET_DIRS) {
        const src = path.resolve(__dirname, dir);
        if (!fs.existsSync(src)) continue;
        fs.cpSync(src, path.resolve(__dirname, 'dist', dir), { recursive: true });
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
        stocks: resolve(__dirname, 'pages/stocks/index.html'),
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
