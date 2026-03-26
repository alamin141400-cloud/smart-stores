import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',          // critical for Electron — uses relative paths
  build: {
    outDir: 'dist',
  },
})
