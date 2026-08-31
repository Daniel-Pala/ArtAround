import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In produzione il Navigator sta sotto /navigator, servito dallo stesso Express del
// marketplace; in sviluppo resta alla radice del server di Vite, che gira le chiamate
// API e il socket verso il backend sulla 3000.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/navigator/' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3000', ws: true }
    }
  }
}))
