// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const REPO_NAME = 'salary_calculator';

export default defineConfig({
  plugins: [react()],
    base: `/${REPO_NAME}/`,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})


// export default defineConfig({
//     plugins: [react()],
//   server: {
//     host: '0.0.0.0',
//     port: 3327,
//     strictPort: true,
//     allowedHosts: ['all'], // Обязательно для Vite 4.5+ / 5.x
//     hmr: {
//       protocol: 'ws',
//       host: undefined, // Автоматически подхватит IP браузера
//       port: 3327,
//     },
//   },
// })