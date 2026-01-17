import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  optimizeDeps: {
    include: ['wagmi', 'viem', '@reown/appkit', '@reown/appkit-adapter-wagmi'],
    force: true,
  },

  ssr: {
    noExternal: [
      'wagmi',
      'viem',
      '@wagmi/core',
      '@wagmi/connectors',
      '@reown/appkit',
      '@reown/appkit-adapter-wagmi',
      '@tanstack/react-query',
    ],
  },

  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        if (warning.message.includes('use client')) return
        defaultHandler(warning)
      },
    },
  },
})