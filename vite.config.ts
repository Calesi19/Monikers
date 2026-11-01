import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the app from /Monikers/; local dev stays at /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Monikers/' : '/',
  plugins: [react()],
}))
