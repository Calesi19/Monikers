import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the app from /Monikers-Pocket/; local dev stays at /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Monikers-Pocket/' : '/',
  plugins: [react()],
}))
