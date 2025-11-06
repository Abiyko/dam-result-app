// vite.config.js
import { defineConfig } from 'vite';
import netlify from "@netlify/vite-plugin";

export default defineConfig({
  plugins: [netlify()],
  base: '/', 
  
  resolve: {
    // node_modulesの依存関係を明示的に解決するように指示
    alias: {
      '@auth0/auth0-spa-js': '@auth0/auth0-spa-js',
    },
  },
});