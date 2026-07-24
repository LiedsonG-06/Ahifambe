import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: './src/test/setup.js', restoreMocks: true, include: ['src/**/*.test.{js,jsx}'] },
  build: { rollupOptions: { output: { manualChunks(id) { if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) return 'leaflet'; if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'react'; return undefined } } } },
})