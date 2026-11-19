import fs from 'fs';
import path, { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Clean URL → subsite HTML entry, mirroring the CloudFront clean-URL rewrite so
// the dev server answers the same paths production does.
const DEV_ROUTES = {
  '/plugins': '/pages/plugins/index.html',
  '/patches': '/pages/patches/index.html',
  '/music': '/pages/music/index.html',
  '/contact': '/pages/contact/index.html',
  '/neworleans': '/pages/neworleans/index.html',
  '/neworleans-tours': '/pages/neworleans/tours.html',
  '/neworleans/tours': '/pages/neworleans/tours.html',
  '/flights': '/pages/flights/index.html',
  '/stocks': '/pages/stocks/index.html',
};

// Subsite asset folders that live outside public/, so Vite does not copy them.
const SUBSITE_ASSET_DIRS = [
  'pages/neworleans/assets',
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
        plugins: resolve(__dirname, 'pages/plugins/index.html'),
        patches: resolve(__dirname, 'pages/patches/index.html'),
        music: resolve(__dirname, 'pages/music/index.html'),
        contact: resolve(__dirname, 'pages/contact/index.html'),
        neworleans: resolve(__dirname, 'pages/neworleans/index.html'),
        neworleansTours: resolve(__dirname, 'pages/neworleans/tours.html'),
        flights: resolve(__dirname, 'pages/flights/index.html'),
        stocks: resolve(__dirname, 'pages/stocks/index.html'),
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
