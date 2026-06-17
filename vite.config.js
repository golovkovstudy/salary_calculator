// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const REPO_NAME = 'salary_calculator';

export default defineConfig({
  plugins: [react()],
    base: `/salary_calculator/`,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
