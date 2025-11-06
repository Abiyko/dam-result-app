// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // 以前ご指摘した基本設定
  base: '/', 
  
  resolve: {
    // node_modulesの依存関係を明示的に解決するように指示
    alias: {
      '@auth0/auth0-spa-js': '@auth0/auth0-spa-js',
    },
  },
});