import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const isVercel = process.env.VERCEL === '1'

export default defineConfig({
  plugins: [react()],
  build: {
    // Vercel does not allow writing output outside the project root.
    // Keep Laravel output locally, but use default frontend dist on Vercel.
    outDir: isVercel ? 'dist' : '../backend/public',
    emptyOutDir: isVercel
  }
})
