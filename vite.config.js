import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Use your repository name surrounded by slashes
  base: '/ParKewo/', 
  plugins: [
    tailwindcss(),
  ],
})