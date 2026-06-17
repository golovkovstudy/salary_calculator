import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const REPO_NAME = 'salary_calculator';

export default defineConfig({
  plugins: [react()],
  base: `/${REPO_NAME}/`,
  server: {
    host: '0.0.0.0',
    port: 80,
    strictPort: true,
    allowedHosts: ['all'],
    hmr: {
      protocol: 'ws',
      host: undefined,
      port: 80,
    },
  },
})