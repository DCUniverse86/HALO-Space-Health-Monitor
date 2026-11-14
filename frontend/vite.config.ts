// Configure Vite for HALO's React and Tailwind frontend.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Enable React support and Tailwind CSS processing.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
