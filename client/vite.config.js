import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true, // Cho phép truy cập qua VS Code Dev Tunnels, Ngrok, IP LAN
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true
      },
      '/logos': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
